# Data Directory

This directory contains all game data files organized by region and detail level.

## Structure

- `boundaries/` - Geographic boundary data
  - `overview/` - Low detail boundaries (Natural Earth 1:110m equivalent)
  - `detailed/` - Medium detail boundaries (Natural Earth 1:10m equivalent)
  - `ultra/` - High detail boundaries (custom detailed data)
- `regions/` - Game data organized by region
  - `nations_*.yaml` - Nation definitions
  - `provinces_*.yaml` - Province definitions