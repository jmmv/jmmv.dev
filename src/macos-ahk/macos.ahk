; Sets up macOS-like keybindings on Windows via AutoHotkey.
;
; Last updated on 2021-07-07.

#SingleInstance force
#NoEnv
#Persistent
#InstallKeybdHook

Menu, Tray, Standard

SetTitleMatchMode, 2

GroupAdd, terminals, ahk_exe powershell.exe
GroupAdd, terminals, ahk_exe WindowsTerminal.exe
GroupAdd, terminals, ahk_exe Cmd.exe
GroupAdd, terminals, ahk_exe mstsc.exe ; Remote desktop.

GroupAdd, posix, ahk_exe powershell.exe
GroupAdd, posix, ahk_exe WindowsTerminal.exe
GroupAdd, posix, ahk_exe Cmd.exe
GroupAdd, posix, ahk_exe gvim.exe
GroupAdd, posix, ahk_exe mstsc.exe ; Remote desktop.

GroupAdd, vscode, ahk_exe VSCodium.exe
GroupAdd, vscode, ahk_exe Code.exe

; Emergency clear.
*PrintScreen::
Reload
Goto ReleaseModifiers
return

; CHEATSHEET
; # Win    ! Alt    ^ Ctrl    + Shift
;
; These modifiers work *after* remapping the modifiers.
; It doesn't matter where the keys are remapped; order is irrelevant.

; Make sure to select the desired mapping for the right-hand menu key.
$AppsKey::RCtrl  ; Surface Laptop.
;$AppsKey::RWin  ; Sculpt keyboard.

; Program launchers.
$#e::Run explorer
$#t::Run wt

; Window manipulation.
$!q::Send !{F4}

; Workspace movement.
$^Left::Send ^#{Left}
$^Right::Send ^#{Right}

; Screenshots.
;!+3::Send {PrintScreen}
;!+4::Send #+{S}

; Hide all instances of active program.
!h::
WinGetClass, class, A
WinGet, AllWindows, List
loop %AllWindows% {
    WinGetClass, WinClass, % "ahk_id " AllWindows%A_Index%
    if(InStr(WinClass,class)){
        WinMinimize, % "ahk_id " AllWindows%A_Index%
    }
}
return

; Lock screen and turn off monitor.
$!^q::
    Sleep, 200
    DllCall("LockWorkStation")
    Sleep, 200
    SendMessage,0x112,0xF170,2,,Program Manager
    return

#IfWinNotActive ahk_group posix
    $!a::Send ^a ; Select all.
    $!f::Send ^f ; Find.
    $!l::Send ^l ; Location bar.
    $!r::Send {F5} ; Refresh.
    $!z::Send ^z ; Undo.
    $!+z::Send ^y ; Redo.
    $^!Space::Send #; ; Emoji selector.

    ; File manipulation.
    $!o::Send ^o
    $!s::Send ^s

    ; Line edits.
    $^k::SendInput +{End}{Delete}
    $^o::SendInput {Enter}{Up}
    $!/::Send ^/ ; Comment line.

    ; Word edits.
    $#Backspace::Send ^{Backspace}
    $!Backspace::Send ^{Backspace}

    ; Cursor movement.
    $^a::Send {Home}
    $^e::Send {End}
    $^p::SendInput {Up}
    $^n::SendInput {Down}
    $^b::SendInput {Left}
    $^f::SendInput {Right}
    $#b::SendInput ^{Left}
    $#f::SendInput ^{Right}

    $!Left::Send {Home}
    $!Right::Send {End}
    $!+Left::Send +{Home}
    $!+Right::Send +{End}

    ; Formatting.
    $!b::Send ^b ; Bold.
    $!i::Send ^i ; Italic.
    $!u::Send ^u ; Underline.
    $!k::Send ^k ; Insert link.
#If

#IfWinActive ahk_group vscode
    $!+p::Send ^+p ; File bar.
    $!p::Send ^p ; File bar.
    $!,::Send ^, ; Settings.
#If

#IfWinNotActive ahk_group terminals
    ; Clipboard.
    $!c::Send ^c
    $!v::Send ^v
    $!+v::Send ^+v
    $!x::Send ^x

    ; Tabs.
    $!w::Send ^w
    $!n::Send ^n
    $!+n::Send ^+n
    $!t::Send ^t
    $!+t::Send ^+t
    $!+{::send ^{PgUp}
    $!+}::send ^{PgDn}
    $!0::Send ^0
    $!1::Send ^1
    $!2::Send ^2
    $!3::Send ^3
    $!4::Send ^4
    $!5::Send ^5
    $!6::Send ^6
    $!7::Send ^7
    $!8::Send ^8
    $!9::Send ^9

    $^d::SendInput {Delete} ; Delete character.
    $!,::Send ^, ; Settings.
#If
#IfWinActive ahk_group terminals
    ; Clipboard.
    $!c::Send ^+c
    $!v::Send ^+v

    ; Tabs.
    $!w::Send ^+w
    $!n::Send ^+n
    $!t::Send ^+t
    $!+{::send ^+{Tab}
    $!+}::send ^{Tab}
    $!0::Send ^!0
    $!1::Send ^!1
    $!2::Send ^!2
    $!3::Send ^!3
    $!4::Send ^!4
    $!5::Send ^!5
    $!6::Send ^!6
    $!7::Send ^!7
    $!8::Send ^!8
    $!9::Send ^!9
    $!+0::Send ^+0
    $!+1::Send ^+1
    $!+2::Send ^+2
    $!+3::Send ^+3
    $!+4::Send ^+4
    $!+5::Send ^+5
    $!+6::Send ^+6
    $!+7::Send ^+7
    $!+8::Send ^+8
    $!+9::Send ^+9

    $!,::Send ^, ; Settings.
#If

ReleaseModifiers:
Send {RCtrl up}
Send {LCtrl up}
Send {RAlt up}
Send {LAlt up}
Send {RWin up}
Send {LWin up}
Send {RShift up}
Send {LShift up}
return
