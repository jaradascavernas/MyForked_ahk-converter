#Requires AutoHotkey v2.1-alpha.17
#SingleInstance Force

; Demo: Native AHK v2.1-alpha module imports (no #Include needed!)
;
; Module search path (default: ".;%A_MyDocuments%\AutoHotkey;%A_AhkPath%\..")
; Search order for "import M":
;   1. M (exact file/folder)
;   2. M\__Init.ahk (package init)
;   3. M.ahk (module file)
;
; This demo expects ArrayHelpers.ahk and StringHelpers.ahk in same directory.

; Import all named exports into current namespace
import * from ArrayHelpers
import * from StringHelpers

; Import default exports with aliases
import ArrayHelpers as ArrayReport
import StringHelpers as StringLabel

; --- Array Helpers Demo ---
numbers := [10, 20, 30, 40, 50]

; Named exports are now in current namespace
sumResult := Sum(numbers)
avgResult := Average(numbers)
normalized := Normalize(numbers)

; Default export - call the alias directly (module's default export)
report := ArrayReport(numbers)

MsgBox(
    'Array Helpers Demo`n`n'
    'Numbers: [10, 20, 30, 40, 50]`n'
    'Sum: ' sumResult '`n'
    'Average: ' avgResult '`n'
    'Normalized: [' NormalizedToStr(normalized) ']`n`n'
    'Report (default export):`n'
    '  count: ' report['count'] '`n'
    '  sum: ' report['sum'] '`n'
    '  average: ' report['average'],
    'ArrayHelpers Module'
)

; --- String Helpers Demo ---
text := 'hello world example'

; Named exports from StringHelpers
title := TitleCase(text)
slug := Slugify(text)
padded := Pad(text, 30, '.')

; Default export - call the alias directly
label := StringLabel(text)

MsgBox(
    'String Helpers Demo`n`n'
    'Input: "' text '"`n`n'
    'TitleCase: ' title '`n'
    'Slugify: ' slug '`n'
    'Pad(30): ' padded '`n`n'
    'Label (default export):`n'
    '  title: ' label['title'] '`n'
    '  slug: ' label['slug'] '`n'
    '  padded: ' label['padded'],
    'StringHelpers Module'
)

; Helper to display normalized array
NormalizedToStr(arr) {
    result := ''
    for i, v in arr {
        result .= (i > 1 ? ', ' : '') . v
    }
    return result
}
