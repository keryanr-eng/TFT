param(
  [string]$WorkbookPath = ".\\design\\AC_cleaned_v1.xlsx",
  [string]$OutputDirectory = ".\\src\\data\\raw"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-SharedStrings {
  param([System.IO.Compression.ZipArchive]$Zip)

  $entry = $Zip.GetEntry("xl/sharedStrings.xml")
  if (-not $entry) {
    return @()
  }

  $reader = [System.IO.StreamReader]::new($entry.Open())
  try {
    $xml = [xml]$reader.ReadToEnd()
  }
  finally {
    $reader.Dispose()
  }

  $strings = @()
  foreach ($si in $xml.sst.si) {
    if ($null -ne $si.t) {
      $strings += [string]$si.t
      continue
    }

    if ($null -ne $si.r) {
      $strings += (($si.r | ForEach-Object { $_.t }) -join "")
      continue
    }

    $strings += ""
  }

  return ,$strings
}

function Get-WorkbookMap {
  param([System.IO.Compression.ZipArchive]$Zip)

  $workbookReader = [System.IO.StreamReader]::new($Zip.GetEntry("xl/workbook.xml").Open())
  $relsReader = [System.IO.StreamReader]::new($Zip.GetEntry("xl/_rels/workbook.xml.rels").Open())

  try {
    $workbookXml = [xml]$workbookReader.ReadToEnd()
    $relsXml = [xml]$relsReader.ReadToEnd()
  }
  finally {
    $workbookReader.Dispose()
    $relsReader.Dispose()
  }

  $relationshipMap = @{}
  foreach ($relationship in $relsXml.Relationships.Relationship) {
    $relationshipMap[[string]$relationship.Id] = [string]$relationship.Target
  }

  $ns = [System.Xml.XmlNamespaceManager]::new($workbookXml.NameTable)
  $ns.AddNamespace("d", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
  $ns.AddNamespace("r", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")

  $sheetMap = @{}
  foreach ($sheet in $workbookXml.SelectNodes("//d:sheets/d:sheet", $ns)) {
    $relationshipId = [string]$sheet.GetAttribute("id", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
    $target = $relationshipMap[$relationshipId]
    if ($target.StartsWith("/")) {
      $sheetMap[[string]$sheet.name] = $target.TrimStart("/")
    }
    else {
      $sheetMap[[string]$sheet.name] = "xl/$target".Replace("xl//", "xl/")
    }
  }

  return $sheetMap
}

function Normalize-WorksheetName {
  param([string]$Value)

  $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
  $builder = [System.Text.StringBuilder]::new()

  foreach ($char in $normalized.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($char) -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }

  return $builder.ToString().ToLowerInvariant()
}

function Get-CellValue {
  param(
    $Cell,
    [string[]]$SharedStrings
  )

  if ($null -eq $Cell) {
    return ""
  }

  $type = [string]$Cell.t

  if ($type -eq "s") {
    return $SharedStrings[[int]$Cell.v]
  }

  if ($type -eq "inlineStr") {
    return [string]$Cell.is.t
  }

  return [string]$Cell.v
}

function Read-SheetRows {
  param(
    [System.IO.Compression.ZipArchive]$Zip,
    [string]$SheetPath,
    [string[]]$SharedStrings,
    [int]$HeaderRow,
    [int]$DataStartRow,
    [hashtable]$ColumnMap
  )

  $reader = [System.IO.StreamReader]::new($Zip.GetEntry($SheetPath).Open())
  try {
    $sheetXml = [xml]$reader.ReadToEnd()
  }
  finally {
    $reader.Dispose()
  }

  $rows = @($sheetXml.worksheet.sheetData.row)
  $header = $rows | Where-Object { [int]$_.r -eq $HeaderRow }
  if (-not $header) {
    throw "Header row $HeaderRow not found in $SheetPath."
  }

  $records = @()
  foreach ($row in $rows | Where-Object { [int]$_.r -ge $DataStartRow }) {
    $record = [ordered]@{}

    foreach ($pair in $ColumnMap.GetEnumerator()) {
      $column = $pair.Key
      $key = $pair.Value
      $cell = $row.c | Where-Object { $_.r -like "$column*" } | Select-Object -First 1
      $record[$key] = (Get-CellValue -Cell $cell -SharedStrings $SharedStrings).Trim()
    }

    $hasValue = ($record.Values | Where-Object { $_ -ne "" }).Count -gt 0
    if ($hasValue) {
      $records += [pscustomobject]$record
    }
  }

  return $records
}

if (-not (Test-Path -LiteralPath $WorkbookPath)) {
  throw "Workbook not found: $WorkbookPath"
}

if (-not (Test-Path -LiteralPath $OutputDirectory)) {
  New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
}

$sheetConfigs = @(
  @{
    SheetName = "Scope V1"
    FileName = "scope.v1.json"
    HeaderRow = 1
    DataStartRow = 2
    ColumnMap = @{
      A = "decision"
      B = "selectedValue"
      C = "reason"
    }
  },
  @{
    SheetName = "Synergies V1"
    FileName = "synergies.v1.json"
    HeaderRow = 1
    DataStartRow = 2
    ColumnMap = @{
      A = "type"
      B = "name"
      C = "tiers"
      D = "tier1Effect"
      E = "tier2Effect"
      F = "tier3Effect"
      G = "gameplayIdentity"
      H = "status"
    }
  },
  @{
    SheetName = "Unites V1"
    FileName = "units.v1.json"
    HeaderRow = 1
    DataStartRow = 2
    ColumnMap = @{
      A = "unit"
      B = "cost"
      C = "family"
      D = "trait1"
      E = "trait2"
      F = "role"
      G = "range"
      H = "maxMana"
      I = "targeting"
      J = "spell"
      K = "shortDescription"
    }
  },
  @{
    SheetName = "Items V1"
    FileName = "items.v1.json"
    HeaderRow = 2
    DataStartRow = 3
    ColumnMap = @{
      A = "component"
      B = "baseStat"
      C = "notes"
      E = "component1"
      F = "component2"
      G = "item"
      H = "stats"
      I = "simpleEffect"
      J = "priority"
    }
  }
)

$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $WorkbookPath))

try {
  $sharedStrings = Get-SharedStrings -Zip $zip
  $sheetMap = Get-WorkbookMap -Zip $zip

  foreach ($config in $sheetConfigs) {
    $sheetPath = $sheetMap[$config.SheetName]
    if (-not $sheetPath) {
      $normalizedLookup = Normalize-WorksheetName $config.SheetName
      $matchedSheetName = $sheetMap.Keys | Where-Object {
        (Normalize-WorksheetName $_) -eq $normalizedLookup
      } | Select-Object -First 1

      if ($matchedSheetName) {
        $sheetPath = $sheetMap[$matchedSheetName]
      }
    }

    if (-not $sheetPath) {
      throw "Sheet not found in workbook: $($config.SheetName)"
    }

    $records = Read-SheetRows `
      -Zip $zip `
      -SheetPath $sheetPath `
      -SharedStrings $sharedStrings `
      -HeaderRow $config.HeaderRow `
      -DataStartRow $config.DataStartRow `
      -ColumnMap $config.ColumnMap

    $outputPath = Join-Path $OutputDirectory $config.FileName
    $records | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $outputPath -Encoding UTF8
    Write-Output "Exported $($records.Count) records to $outputPath"
  }
}
finally {
  $zip.Dispose()
}
