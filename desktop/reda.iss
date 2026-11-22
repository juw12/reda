; Reda for Windows - per-user installer (no admin rights). build.py compiles it with:
;   iscc /DAppVersion=1.0.0 /DSourceDir=<dist\Reda> /DOutputDir=<dist> /DIconFile=<build\reda.ico> reda.iss
; Installs to %LOCALAPPDATA%\Programs\Reda, adds Reda to the Start menu (and optionally the desktop) and lists it
; in Settings > Apps. The window keeps its data (what you saved in it) in %LOCALAPPDATA%\Reda, which
; uninstalling leaves in place so a reinstall finds it again.

#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif
#ifndef SourceDir
  #define SourceDir "dist\Reda"
#endif
#ifndef OutputDir
  #define OutputDir "dist"
#endif
#ifndef IconFile
  #define IconFile "build\reda.ico"
#endif

[Setup]
AppId={{E81247BA-698B-569E-A6DE-E1E1C366EEFB}
AppName=Reda
AppVersion={#AppVersion}
AppVerName=Reda {#AppVersion}
AppPublisher=Juwen Lie
AppPublisherURL=https://juw12.github.io/reda/
AppSupportURL=https://github.com/juw12/reda
DefaultDirName={autopf}\Reda
DisableDirPage=yes
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir={#OutputDir}
OutputBaseFilename=Reda-Windows-Setup
SetupIconFile={#IconFile}
UninstallDisplayIcon={app}\Reda.exe
UninstallDisplayName=Reda
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=no
SetupLogging=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{userprograms}\Reda"; Filename: "{app}\Reda.exe"; Comment: "Catat biduran kronis, temukan pola pemicu, tes diri"
Name: "{userdesktop}\Reda"; Filename: "{app}\Reda.exe"; Comment: "Catat biduran kronis, temukan pola pemicu, tes diri"; Tasks: desktopicon

[Run]
Filename: "{app}\Reda.exe"; Description: "{cm:LaunchProgram,Reda}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{app}\Reda.exe"; Parameters: "--stop"; Flags: runhidden waituntilterminated; RunOnceId: "StopReda"

[Code]
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
begin
  Result := '';
  { Updating: close an open Reda window first so its files can be replaced. }
  if FileExists(ExpandConstant('{app}\Reda.exe')) then
    Exec(ExpandConstant('{app}\Reda.exe'), '--stop', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;
