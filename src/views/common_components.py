import flet as ft
from config import Config

def CustomButton(text, on_click, icon=None, color=Config.COLOR_PRIMARY, width=None):
    return ft.ElevatedButton(
        content=ft.Row(
            [ft.Icon(icon, size=18), ft.Text(text, weight="600", size=14)] if icon else [ft.Text(text, weight="600", size=14)],
            alignment=ft.MainAxisAlignment.CENTER,
            spacing=8
        ),
        bgcolor=color,
        color=Config.COLOR_WHITE,
        width=width,
        height=45,
        style=ft.ButtonStyle(
            shape=ft.RoundedRectangleBorder(radius=10),
        ),
        on_click=on_click
    )

def CardContainer(content, padding=20):
    return ft.Container(
        content=content,
        padding=padding,
        bgcolor=Config.COLOR_WHITE,
        border_radius=12,
        shadow=ft.BoxShadow(
            spread_radius=0,
            blur_radius=10,
            color=ft.colors.with_opacity(0.05, ft.colors.BLACK),
            offset=ft.Offset(0, 4),
        )
    )

def SectionHeader(title, subtitle=None):
    controls = [ft.Text(title, size=24, weight="800", color=Config.COLOR_SECONDARY, letter_spacing=-0.5)]
    if subtitle:
        controls.append(ft.Text(subtitle, size=13, color="#64748b", weight="500"))
    return ft.Column(controls, spacing=4)

def StatusBadge(text, bg_color, text_color):
    return ft.Container(
        content=ft.Text(text, size=10, weight="bold", color=text_color),
        bgcolor=bg_color,
        padding=ft.padding.symmetric(8, 4),
        border_radius=6
    )
