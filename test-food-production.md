# Food Production System Test

## Changes Made

### 1. Fixed Building Requirements
- Changed `food_farm` to require `plains` feature instead of `agricultural`
- Changed `fishing_fleet` to require only `coastal` instead of both `coastal` and `fishing_grounds`
- Changed `food_farm` to consume `water` instead of `oil` (more realistic)

### 2. Added Missing Features to Provinces
- Added `farmland` and `plains` features to provinces that can support agriculture
- Added `plains` feature to German North Sea Coast for food farms

### 3. Added Water Resource
- Added `water` resource to `resources.yaml` and `gameData.ts`
- Base price: 0.01 per liter

### 4. Improved Resource Production Simulation
- Fixed building efficiency calculation in `useSimulationEngine.ts`
- Added debug logging for food production specifically
- Buildings now properly check for required inputs before operating
- Added proper error handling and resource consumption logic

### 5. Added Test Food Farms
- Added food farms to sample provinces in `provinces.yaml`:
  - Lower Saxony (Germany): Has plains and farmland features
  - California (USA): Has farmland feature  
  - Texas Oil Fields (USA): Has farmland feature

### 6. Fixed Resource Stockpile Initialization
- Nations now start with realistic resource stockpiles:
  - Food: 10,000 tons
  - Water: 1,000,000 liters
  - Manpower: 100,000 people
  - Electricity: 5,000 MWh
  - Oil: 1,000 barrels
  - Steel: 500 tons

### 7. Enhanced Debug Logging
- Added specific logging for food production and consumption
- Shows which buildings are producing food and how much
- Logs when buildings cannot operate due to missing inputs
- Shows resource stockpile changes each tick

## Expected Results

When the game runs, you should see:
1. Food production from farms in provinces with the right features
2. Debug console logs showing food production amounts
3. Resource stockpiles updating in the nation overview panel
4. Food consumption by population
5. Proper notifications if food shortages occur

## Testing Steps

1. Start the game and select United States as your nation
2. Open browser console to see debug logs
3. Watch the Nation Overview panel for food stockpile changes
4. Food production should be visible in provinces with farms
5. Check that farms are consuming water and producing food each tick