#! /opt/microsoft/powershell/7/pwsh

param(
    [Parameter(HelpMessage="Forces execution")]
    [switch]$Force = $False,

    [Parameter(Mandatory, HelpMessage="The path to affect")]
    [string]$Path
)

Write-Output "Force: $Force"
Write-Output "Path: $Path"
