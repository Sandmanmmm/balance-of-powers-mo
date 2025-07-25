# Balance of Powers - Grand Strategy Game PRD

A real-time grand strategy simulation game spanning 1990-2050, focusing on modern geopolitical complexity through province-based gameplay and emergent AI behavior.

**Experience Qualities**:
1. **Immersive** - Deep simulation systems create believable world evolution with authentic geopolitical complexity
2. **Strategic** - Multi-layered decision making across politics, economics, military, technology, and diplomacy requires thoughtful planning
3. **Dynamic** - Real-time gameplay with emergent AI behavior ensures no two playthroughs feel the same

**Complexity Level**: Complex Application (advanced functionality with persistent state)
The game requires sophisticated real-time simulation, AI systems, data visualization, and persistent world state across multiple interconnected systems.

## Essential Features

### Interactive Province Map
- **Functionality**: Zoomable world map with detailed province information, overlays, and real-time updates
- **Purpose**: Central interface for all game interactions and data visualization
- **Trigger**: Game loads with map as primary interface
- **Progression**: Load map → Select zoom level → Choose overlay type → Click province → View detailed information → Take actions
- **Success criteria**: Smooth pan/zoom, clear province boundaries, responsive overlay switching, detailed province tooltips

### Real-Time Simulation Engine
- **Functionality**: Continuous time progression with pause/resume mechanics driving all game systems
- **Purpose**: Creates dynamic, evolving world without turn-based constraints
- **Trigger**: Game start begins time progression
- **Progression**: Start simulation → Time advances continuously → Events trigger automatically → Player can pause → Make decisions → Resume time
- **Success criteria**: Stable time progression, accurate event scheduling, responsive pause/resume

### Nation Management Dashboard
- **Functionality**: Comprehensive view of controlled nation's statistics, policies, and current status
- **Purpose**: Provides strategic overview and decision-making interface
- **Trigger**: Select controlled nation or access main dashboard
- **Progression**: Open dashboard → Review current stats → Identify issues → Access policy options → Make changes → Monitor results
- **Success criteria**: Clear data presentation, intuitive policy controls, real-time stat updates

### Province Data System
- **Functionality**: Detailed province information including demographics, resources, infrastructure, politics, and military
- **Purpose**: Provides granular control and information for strategic decisions
- **Trigger**: Click on any province
- **Progression**: Select province → View overview → Switch between data tabs → Analyze trends → Take province-specific actions
- **Success criteria**: Comprehensive data display, easy navigation between categories, historical trend visualization

### Event System
- **Functionality**: Dynamic events based on game state, including political crises, natural disasters, and international incidents
- **Purpose**: Creates unpredictable challenges and opportunities
- **Trigger**: Time-based conditions or player actions meet event criteria
- **Progression**: Event triggers → Notification appears → Present options → Player chooses response → Consequences applied
- **Success criteria**: Contextually appropriate events, meaningful choices, clear consequences

## Edge Case Handling
- **Invalid Province Data**: Graceful fallback to default values with error logging
- **Simulation Overflow**: Automatic pause and warning when calculations exceed safe limits
- **Save/Load Corruption**: Multiple save slots with integrity checking
- **Network Disconnection**: Local simulation continues with sync on reconnection
- **Memory Constraints**: Dynamic data loading and unloading based on map zoom level

## Design Direction
The design should feel authoritative and analytical like professional geopolitical software, with clean data visualization reminiscent of modern intelligence dashboards, while maintaining approachable game-like interactions that don't overwhelm casual strategy players.

## Color Selection
Custom palette focusing on geopolitical authority and data clarity.
- **Primary Color**: Deep navy blue (oklch(0.25 0.08 240)) - Conveys authority, stability, and professional geopolitical analysis
- **Secondary Colors**: Muted slate grays (oklch(0.65 0.02 240)) for UI backgrounds and subtle charcoal (oklch(0.35 0.04 240)) for text
- **Accent Color**: Strategic orange (oklch(0.65 0.15 45)) for highlighting active selections, warnings, and critical information
- **Foreground/Background Pairings**:
  - Background (White oklch(0.98 0 0)): Navy text (oklch(0.25 0.08 240)) - Ratio 7.2:1 ✓
  - Primary (Navy oklch(0.25 0.08 240)): White text (oklch(0.98 0 0)) - Ratio 7.2:1 ✓
  - Secondary (Slate oklch(0.65 0.02 240)): Navy text (oklch(0.25 0.08 240)) - Ratio 4.8:1 ✓
  - Accent (Orange oklch(0.65 0.15 45)): White text (oklch(0.98 0 0)) - Ratio 5.1:1 ✓

## Font Selection
Typography should convey analytical precision and modern professionalism, using clear sans-serif fonts optimized for data-heavy interfaces and extended reading sessions.

- **Typographic Hierarchy**:
  - H1 (Game Title): Inter Bold/32px/tight letter spacing
  - H2 (Section Headers): Inter Semibold/24px/normal spacing  
  - H3 (Panel Titles): Inter Medium/18px/normal spacing
  - Body (Data/UI): Inter Regular/14px/relaxed line height
  - Small (Tooltips): Inter Regular/12px/compact spacing
  - Data Tables: JetBrains Mono/13px/monospace for precise alignment

## Animations
Animations should feel analytical and purposeful, emphasizing data flow and system relationships rather than decorative flourishes, supporting the serious strategic nature of geopolitical simulation.

- **Purposeful Meaning**: Smooth data transitions reinforce cause-and-effect relationships; province highlighting guides strategic focus; loading states communicate complex calculations
- **Hierarchy of Movement**: Map interactions (pan/zoom) take priority, followed by data panel transitions, with subtle micro-interactions for secondary elements

## Component Selection
- **Components**: 
  - `Card` for province information panels and statistics displays
  - `Tabs` for switching between different data views (politics, economy, military)
  - `Button` with variants for primary actions (policies) and secondary actions (data views)
  - `Dialog` for event notifications and critical decisions
  - `Table` for detailed statistics and rankings
  - `Progress` for various meters (unrest, approval, infrastructure levels)
  - `Tooltip` for contextual province and map information
  - `Select` for choosing overlays, time speeds, and filters
- **Customizations**: 
  - Custom map component with SVG provinces and zoom controls
  - Specialized data visualization components for charts and graphs
  - Real-time update indicators for live data
- **States**: Buttons show distinct hover/active states; map provinces highlight on hover with smooth color transitions; active overlays have clear visual indicators
- **Icon Selection**: Phosphor icons for government (Buildings), military (Shield), economy (TrendUp), population (Users), technology (Gear)
- **Spacing**: Consistent 4px base unit with 16px for component gaps, 24px for section spacing, 32px for major layout divisions
- **Mobile**: Map remains primary interface with collapsible side panels; touch-optimized province selection; bottom sheet for detailed information; simplified overlay controls