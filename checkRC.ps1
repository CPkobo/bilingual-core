$tovisRC = Get-Content .\.tovisrc
$pwd = Get-Location
$noErr = $true

foreach ($line in $tovisRC) {
    if ($line.StartsWith("#") -eq $false) {
        $path = $line.Replace("<pwd>", $pwd)
        if ((test-path $path) -eq $false) {
            $noErr = $false
            Write-Host "$line not found"
        }
    }
}
