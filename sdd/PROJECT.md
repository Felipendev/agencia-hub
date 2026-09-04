# Project Configuration
# Only contains overrides. Properties not listed use framework defaults.

## Platform

platform:
  type: frontend-web          # Next.js 16 · React 19 · Tailwind 4

frontend:
  ui_library: custom          # React customizado — NÃO usa Nordic/Andes
  # Convenções já em uso no código (não configuráveis, registradas como referência):
  #  • Component architecture: feature-based (components/cliente, components/cotacao,
  #    components/charts, components/ui)
  #  • State management: React Context (auth-context, data-context,
  #    notification-context, timeline-context)
  #  • Styling: Tailwind 4 + CSS vars (--hub-*)
  #  • Testing: Vitest + Testing Library

## Quality Gates

coverage:
  min_coverage: 90            # Override: time exige 90% em vez do default de 80%

## Team Conventions

language:
  specs: pt                   # Override: specs em português (consistente com o hub e o backend)

## Contexto

Este repo é o alvo de implementação das **telas** da área de milhas do agencia-hub —
ver o direcionador em `../milhas-hub/SDD-DIRECIONADOR.md`. Milhas é uma faceta de
`customers`, não um app separado. O backend vive em `../agencia-hub-api`.

Atenção: existem `.cursor/rules.md` e `.kiro/specs` neste repo, que podem conter
instruções concorrentes com o SDD Kit. Rodar `/sdd.doctor` para diagnosticar.
