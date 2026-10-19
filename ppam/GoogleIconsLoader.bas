' Google Icons loader for PowerPoint (Mac)
' Saved as GoogleIcons.ppam and registered in Tools > PowerPoint Add-ins.
' It opens GoogleIconsLauncher.pptx for a few seconds so the Google Icons
' add-in gets loaded (its ribbon button stays after the launcher closes).
' Triggers: ribbon onLoad at startup (Auto_Open does not fire on Mac),
' and the "Google Icons" button on the Insert tab as a manual fallback.
' The launcher lives in PowerPoint's own Documents folder (no sandbox prompt).
Option Explicit

Private Const LAUNCHER As String = "GoogleIconsLauncher.pptx"
Private Const WAIT_SECONDS As Single = 4

Private loadedOnce As Boolean

Sub Auto_Open()
    GoogleIcons_Load False
End Sub

' customUI onLoad: runs when PowerPoint loads this add-in's ribbon
Sub GoogleIcons_OnRibbonLoad(ribbon As IRibbonUI)
    GoogleIcons_Load False
End Sub

' customUI button on the Insert tab
Sub GoogleIcons_OnButton(control As IRibbonControl)
    GoogleIcons_Load True
End Sub

Sub GoogleIcons_Load(Optional ByVal verbose As Boolean = True)
    Dim path As String
    Dim pres As Presentation
    Dim started As Single

    If loadedOnce And Not verbose Then Exit Sub

    path = LauncherPath()
    If path = "" Then
        If verbose Then MsgBox "Google Icons: launcher not found (" & LAUNCHER & ")"
        Exit Sub
    End If

    On Error GoTo Failed
    Set pres = Presentations.Open(FileName:=path, ReadOnly:=msoTrue, Untitled:=msoFalse, WithWindow:=msoTrue)

    ' Give the add-in time to load before closing the launcher
    started = Timer
    Do While Timer - started < WAIT_SECONDS
        DoEvents
    Loop
    pres.Close
    loadedOnce = True
    Exit Sub

Failed:
    If verbose Then MsgBox "Google Icons: could not open the launcher. " & Err.Description
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
