' Google Icons loader for PowerPoint (Mac)
' Saved as GoogleIcons.ppam and registered in Tools > PowerPoint Add-ins.
' On startup it opens GoogleIconsLauncher.pptx for a few seconds so the
' Google Icons add-in gets loaded and its ribbon button appears, then closes it.
' The launcher lives in PowerPoint's own Documents folder (no sandbox prompt).
Option Explicit

Private Const LAUNCHER As String = "GoogleIconsLauncher.pptx"
Private Const WAIT_SECONDS As Single = 6

Sub Auto_Open()
    GoogleIcons_Load
End Sub

Sub GoogleIcons_Load()
    Dim path As String
    Dim pres As Presentation
    Dim started As Single

    path = LauncherPath()
    If path = "" Then Exit Sub

    On Error Resume Next
    Set pres = Presentations.Open(FileName:=path, ReadOnly:=msoTrue, Untitled:=msoFalse, WithWindow:=msoTrue)
    If pres Is Nothing Then Exit Sub

    ' Give the add-in time to load before closing the launcher
    started = Timer
    Do While Timer - started < WAIT_SECONDS
        DoEvents
    Loop
    pres.Close
End Sub

Private Function LauncherPath() As String
    Dim candidates(1) As String
    Dim i As Integer
    On Error Resume Next
    ' Inside the sandbox HOME is the container; outside it is the real home
    candidates(0) = Environ("HOME") & "/Documents/" & LAUNCHER
    candidates(1) = Environ("HOME") & "/Library/Containers/com.microsoft.Powerpoint/Data/Documents/" & LAUNCHER
    For i = 0 To 1
        If Dir(candidates(i)) <> "" Then
            LauncherPath = candidates(i)
            Exit Function
        End If
    Next i
End Function
