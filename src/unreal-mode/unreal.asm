;;;
;;; Copyright 2024 Julio Merino.  All rights reserved.
;;;
;;; Redistribution and use in source and binary forms, with or without
;;; modification, are permitted provided that the following conditions are met:
;;;
;;; * Redistributions of source code must retain the above copyright notice,
;;;   this list of conditions and the following disclaimer.
;;; * Redistributions in binary form must reproduce the above copyright notice,
;;;   this list of conditions and the following disclaimer in the documentation
;;;   and/or other materials provided with the distribution.
;;; * Neither the name of rules_shtk nor the names of its contributors may be
;;;   used to endorse or promote products derived from this software without
;;;   specific prior written permission.
;;;
;;; THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
;;; AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
;;; IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
;;; ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
;;; LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
;;; CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
;;; SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
;;; INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
;;; CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
;;; ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
;;; POSSIBILITY OF SUCH DAMAGE.
;;;

;;;
;;; This program demonstrates how to enter protected mode from a COM program
;;; and how to return to unreal mode by leaving FS configured to a segment
;;; with a 4 GB limit.
;;;
;;; This program is meant to be compiled with "nasm -o unreal.com unreal" and
;;; run directly from DOSBox.  It intentionally does not use sections to keep
;;; the whole binary flat.  That said, you can also compile this as a boot
;;; sector by changing the initial address to 7c00h; if you do that, however,
;;; you will also have to change the code that runs after entering unreal
;;; mode because int 21h is not present without DOS.
;;;

    org 100h                    ; Change to 7c00h for boot sector.
    jmp start

;;;
;;; The GDT itself.
;;;

gdt:

;;; Null descriptor.
                dq 0

;;; Code descriptor for this binary.  The base address needs fixup at
;;; runtime to point to the location where the code was loaded.
CODE_DESC       equ 1 << 3
                dw 0ffffh       ; Low 16 bits of the limit.
code_base_low   dw 0            ; Low 16 bits of the base address.
code_base_mid   db 0            ; Middle 8 bits of the base address.
                db 10011110b    ; Code/data, exec, conforming, read allowed.
                db 00000000b    ; Not 4KB, 16-bit, no long mode, limit 00h.
code_base_high  db 0            ; High 8 bits of the base address.

;;; Data/stack descriptor for this binary.  The base address needs fixup
;;; at runtime to point to the location where the code was loaded.
DATA_DESC       equ 2 << 3
                dw 0ffffh       ; Low 16 bits of the limit.
data_base_low   dw 0            ; Low 16 bits of the base address.
data_base_mid   db 0            ; Middle 8 bits of the base address.
                db 10010010b    ; Code/data, data, grows up, read-write.
                db 00000000b    ; Not 4KB, 16-bit, no long mode, limit 00h.
data_base_high  db 0            ; High 8 bits of the base address.

;;; Linear data descriptor covering the full 4 GB address space.  No fixup
;;; necessary.
LINEAR_DESC     equ 3 << 3
                dw 0ffffh       ; Low 16 bits of the limit.
                dw 0            ; Low 8 bits of the base address.
                db 0            ; Middle 8 bits of the base address.
                db 10010010b    ; Code/data, data, grows up, read-write.
                db 11001111b    ; 4KB, 16-bit, no long mode, limit=0fh.
                db 0            ; High 8 bits of the base address.

;;;
;;; GDT descriptor.
;;;

gdt_desc        dw $-gdt
gdt_base        dd 0

;;;
;;; Miscellaneous data.
;;;

;;; The message to print to the console.  We'll first copy it to extended
;;; memory and then restore it over msgcopy in conventional memory by using
;;; unreal mode addressing.
msg             db 'Hello, unreal mode!', 0ah
MSGLEN          equ $-msg

;;; The address in extended memory where we'll copy the msg in protected
;;; mode to prove that unreal mode can still access it.  Can be anything
;;; above 1 MB.
EXTENDED_ADDR   equ 4 * 1024 * 1024

;;; The buffer to copy msg into once we are in unreal mode.
msgcopy         db '...................', 0ah

;;; Copy of our original segment registers.  Because we expect this to
;;; be a COM program, we can assume all other segments match CS.
real_cs          dw  0

;;;
;;; Program entry point
;;;

start:
    ;; Assume CS = DS = ES = SS (COM file or boot sector).
    mov [real_cs], cs

    ;; Populate the GDT code and data descriptors with our actual base address
    ;; so that the built-in code offsets work once we enter protected mode.
    xor eax, eax
    mov ax, cs
    shl eax, 4
    mov [code_base_low], ax
    mov [data_base_low], ax
    shr eax, 16
    mov [code_base_mid], al
    mov [data_base_mid], al
    mov [code_base_high], ah
    mov [data_base_high], ah

    ;; Populate the GDT descriptor with the linear address of the GDT.
    xor eax, eax
    mov eax, ds
    shl eax, 4
    add eax, gdt
    mov [gdt_base], eax

    ;; Disable the Non-Maskable Interrupt (NMI) and interrupts.
    in al, 70h
    or al, 80h
    out 70h, al
    in al, 71h
    cli

    ;; Enable the A20 gate.
    in al, 92h
    or al, 2
    out 92h, al

    ;; Load the GDT.
    lgdt [gdt_desc]

    ;; Enable protected mode.
    mov eax, cr0
    or eax, 1
    mov cr0, eax

    ;; Flush out the processor pipeline and reload CS.
    jmp CODE_DESC:protected_mode

;;;
;;; Protected mode entry point.
;;;
;;; Note that we set up the code segment to be in 16-bit mode, so we do not
;;; switch assembly modes here.
;;;

protected_mode:
    ;; Set up the data and stack segments.
    mov ax, DATA_DESC
    mov ds, ax
    mov ss, ax

    ;; Store a message in extended memory.  We are in protected mode so this
    ;; works by design.
    mov ax, LINEAR_DESC         ; Load the linear address space in ES.
    mov es, ax
    mov esi, msg                ; Point DS:[ESI] to our message.
    mov edi, EXTENDED_ADDR      ; Point ES:[EDI] to extended memory.
    mov ecx, MSGLEN
    o32 rep movsb               ; Must use 32-bit addressing.

    ;; Set up FS as an "unreal mode" segment.
    mov ax, LINEAR_DESC
    mov fs, ax
    ;; ... but restore ES to have standard real mode limits.  Not strictly
    ;; necessary but helps to prove our example.
    mov ax, DATA_DESC
    mov es, ax

    ;; Disable protected mode.
    mov eax, cr0
    and eax, ~1
    mov cr0, eax

    ;; And now return to real mode with a far jump.
    pushf
    push word [real_cs]
    push unreal_mode
    iret

;;;
;;; Unreal mode entry point.
;;;
;;; All segment registers should be restored but we left FS configured with a
;;; high memory limit so that we can still access extended memory.
;;;

unreal_mode:
    ;; Reload real mode COM segment layout.
    mov bx, cs
    mov ds, bx
    mov es, bx
    mov ss, bx

    ;; Reenable the NMI and interrupts.
    sti
    in al, 70h
    and al, 7fh
    out 70h, al
    in al, 71h
    ;; ... but keep A20 enabled!

    ;; Fetch the message from extended memory by using a large offset.  This
    ;; would not work in real mode or VM86 (even with 32-bit addressing), but
    ;; does because we are actually in unreal mode.
    xor ax, ax                  ; Clear FS to show its high limits remain.
    mov fs, ax
    mov esi, EXTENDED_ADDR      ; Point FS:[ESI] to extended memory.
    mov edi, msgcopy            ; Point ES:[EDI] to our buffer.
    mov ecx, MSGLEN
    o32 fs rep movsb            ; Must use 32-bit addressing.

    ;; Print the message we fetched from extended mode.
    mov ah, 40h
    mov bx, 1
    mov cx, MSGLEN
    mov dx, msgcopy             ; Remember this was all ... at first!
    int 21h

    ;; And jump back to DOS.
    mov ax, 4c00h
    int 21h
