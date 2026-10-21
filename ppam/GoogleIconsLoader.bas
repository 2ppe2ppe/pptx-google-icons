' Google Icons loader for PowerPoint (Mac)
' Saved as GoogleIcons.ppam and registered in Tools > PowerPoint Add-ins.
' It opens GoogleIconsLauncher.pptx for a few seconds so the Google Icons
' add-in gets loaded (its ribbon button stays after the launcher closes).
' Runs from the ribbon onLoad at startup (Auto_Open does not fire on Mac).
'
' Files in PowerPoint's own Documents folder (no sandbox prompt):
'   GoogleIconsLauncher.pptx  the launcher
'   GoogleIconsLoader.txt     optional settings, one per line:
'                               delay=0    seconds to wait before opening
'                               wait=8     seconds to keep the launcher open
'                               window=1   1 = show the launcher, 0 = hidden
'                               activate=1 1 = bring the launcher to the front
'                               close=1    1 = close after waiting, 0 = minimize and keep open
'   GoogleIconsLoader.log     what happened at each startup
'
' The add-in only starts when the launcher window is in front, so it is
' activated after opening (it may open behind a presentation the user opened).
Option Explicit

Private Const LAUNCHER As String = "GoogleIconsLauncher.pptx"
Private Const SETTINGS As String = "GoogleIconsLoader.txt"
Private Const LOGFILE As String = "GoogleIconsLoader.log"

Private loadedOnce As Boolean

Sub Auto_Open()
    GoogleIcons_Load False
End Sub

' customUI onLoad: runs when PowerPoint loads this add-in's ribbon
Sub GoogleIcons_OnRibbonLoad(ribbon As IRibbonUI)
    GoogleIcons_Load False
End Sub

' kept for a ribbon button if one is added again
Sub GoogleIcons_OnButton(control As IRibbonControl)
    GoogleIcons_Load True
End Sub

Sub GoogleIcons_Load(Optional ByVal verbose As Boolean = True)
    Dim folder As String
    Dim pres As Presentation
    Dim delaySec As Single, waitSec As Single
    Dim showWindow As Boolean, bringFront As Boolean, closeAfter As Boolean

    If loadedOnce And Not verbose Then Exit Sub

    folder = DocsFolder()
    If folder = "" Then
        If verbose Then MsgBox "Google Icons: launcher not found (" & LAUNCHER & ")"
        Exit Sub
    End If

    ' Already open (kept open from earlier): nothing to do
    If LauncherIsOpen() Then
        loadedOnce = True
        WriteLog folder, "skip launcher already open"
        Exit Sub
    End If

    delaySec = Val(Setting(folder, "delay", "0"))
    waitSec = Val(Setting(folder, "wait", "8"))
    showWindow = (Setting(folder, "window", "1") <> "0")
    bringFront = (Setting(folder, "activate", "1") <> "0")
    closeAfter = (Setting(folder, "close", "1") <> "0")
    WriteLog folder, "start delay=" & delaySec & " wait=" & waitSec & " window=" & IIf(showWindow, 1, 0) & _
                     " activate=" & IIf(bringFront, 1, 0) & " close=" & IIf(closeAfter, 1, 0) & _
                     " presentations=" & Presentations.Count

    Pause delaySec

    On Error GoTo Failed
    Set pres = Presentations.Open(FileName:=folder & LAUNCHER, ReadOnly:=msoTrue, Untitled:=msoFalse, _
                                  WithWindow:=IIf(showWindow, msoTrue, msoFalse))
    WriteLog folder, "opened windows=" & pres.Windows.Count

    If bringFront And pres.Windows.Count > 0 Then
        On Error Resume Next
        pres.Windows(1).Activate
        WriteLog folder, "activated active=" & ActiveWindow.Presentation.Name & IIf(Err.Number <> 0, " err=" & Err.Description, "")
        Err.Clear
        On Error GoTo Failed
    End If

    ' Give the add-in time to load before closing the launcher
    Pause waitSec
    loadedOnce = True
    If closeAfter Then
        pres.Close
        WriteLog folder, "closed"
    ElseIf pres.Windows.Count > 0 Then
        pres.Windows(1).WindowState = ppWindowMinimized
        WriteLog folder, "minimized"
    End If
    Exit Sub

Failed:
    WriteLog folder, "error " & Err.Number & " " & Err.Description
    If verbose Then MsgBox "Google Icons: could not open the launcher. " & Err.Description
End Sub

Private Function LauncherIsOpen() As Boolean
    Dim p As Presentation
    On Error Resume Next
    For Each p In Presentations
        If p.Name = LAUNCHER Then LauncherIsOpen = True
    Next p
End Function

Private Sub Pause(ByVal seconds As Single)
    Dim started As Single
    If seconds <= 0 Then Exit Sub
    started = Timer
    Do While Timer - started < seconds And Timer >= started
        DoEvents
    Loop
End Sub

' Folder holding the launcher, with a trailing slash
Private Function DocsFolder() As String
    Dim candidates(1) As String
    Dim i As Integer
    On Error Resume Next
    ' Inside the sandbox HOME is the container; outside it is the real home
    candidates(0) = Environ("HOME") & "/Documents/"
    candidates(1) = Environ("HOME") & "/Library/Containers/com.microsoft.Powerpoint/Data/Documents/"
    For i = 0 To 1
        If Dir(candidates(i) & LAUNCHER) <> "" Then
            DocsFolder = candidates(i)
            Exit Function
        End If
    Next i
End Function

Private Function Setting(ByVal folder As String, ByVal key As String, ByVal fallback As String) As String
    Dim f As Integer, lineText As String, pos As Integer
    Setting = fallback
    On Error GoTo Done
    If Dir(folder & SETTINGS) = "" Then Exit Function
    f = FreeFile
    Open folder & SETTINGS For Input As #f
    Do While Not EOF(f)
        Line Input #f, lineText
        pos = InStr(lineText, "=")
        If pos > 0 Then
            If LCase(Trim(Left(lineText, pos - 1))) = key Then Setting = Trim(Mid(lineText, pos + 1))
        End If
    Loop
Done:
    On Error Resume Next
    If f > 0 Then Close #f
End Function

Private Sub WriteLog(ByVal folder As String, ByVal message As String)
    Dim f As Integer
    On Error Resume Next
    f = FreeFile
    Open folder & LOGFILE For Append As #f
    Print #f, Format(Now, "yyyy-mm-dd hh:nn:ss") & " " & message
    Close #f
End Sub
