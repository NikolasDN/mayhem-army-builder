# BattleScribe XML Parser for Angular

This implementation provides a hybrid approach to reading BattleScribe XML files in Angular, combining direct XML parsing with TypeScript interfaces for type safety.

## Features

- **Direct XML Parsing**: Uses browser-native `DOMParser` for efficient XML parsing
- **TypeScript Interfaces**: Full type safety with comprehensive interfaces for BattleScribe data structures
- **Service-based Architecture**: Clean separation of concerns with a dedicated service
- **Multiple Data Types**: Support for catalogues, game systems, and data indexes
- **Utility Methods**: Helper methods for filtering and searching data
- **Error Handling**: Robust error handling with meaningful error messages

## File Structure

```
src/
├── app/
│   ├── services/
│   │   └── battlescribe.service.ts          # Main service with interfaces
│   ├── components/
│   │   ├── data-viewer.component.ts         # Data visualization component
│   │   └── service-examples.component.ts    # Usage examples
│   └── assets/
│       └── data/                            # XML files location
│           ├── MayhemBattleChest.cat
│           ├── MayhemBattleChest.gst
│           └── index.xml
```

## Core Interfaces

### BattleScribeCatalogue
Represents the main catalogue structure with entries, rules, and profiles.

### BattleScribeEntry
Individual entries (units, models, etc.) with their properties and relationships.

### BattleScribeProfile
Statistical profiles with characteristics (MOV, CQ, BAR, etc.).

### BattleScribeRule
Game rules and special abilities.

### BattleScribeEntryGroup
Groups of related entries.

### BattleScribeLink
References to other entries, rules, or profiles.

### BattleScribeModifier
Modifications to entries or characteristics.

### BattleScribeCondition
Conditions that apply to modifiers.

## Usage Examples

### 1. Basic Data Loading

```typescript
import { BattleScribeService } from './services/battlescribe.service';

constructor(private battleScribeService: BattleScribeService) {}

loadData() {
  this.battleScribeService.loadCatalogue().subscribe({
    next: (catalogue) => {
      console.log('Loaded catalogue:', catalogue.name);
      console.log('Total entries:', catalogue.entries.length);
    },
    error: (err) => {
      console.error('Error loading data:', err);
    }
  });
}
```

### 2. Filtering Entries

```typescript
// Filter by type
const modelEntries = this.battleScribeService.getEntriesByType(catalogue, 'model');

// Filter by category
const categoryEntries = this.battleScribeService.getEntriesByCategory(catalogue, 'categoryId');

// Find specific entry
const entry = this.battleScribeService.getEntryById(catalogue, 'entryId');
```

### 3. Working with Profiles

```typescript
// Get a profile by ID
const profile = this.battleScribeService.getProfileById(catalogue, 'profileId');

// Access characteristics
profile.characteristics.forEach(char => {
  console.log(`${char.name}: ${char.value}`);
});
```

### 4. Loading Multiple Data Types

```typescript
// Load catalogue
this.battleScribeService.loadCatalogue().subscribe(catalogue => {
  // Handle catalogue data
});

// Load game system
this.battleScribeService.loadGameSystem().subscribe(gameSystem => {
  // Handle game system data
});

// Load data index
this.battleScribeService.loadDataIndex().subscribe(dataIndex => {
  // Handle data index
});
```

## Setup Requirements

1. **HTTP Client**: Ensure `provideHttpClient()` is added to your app configuration
2. **Assets**: Place XML files in `src/assets/data/` directory
3. **File Paths**: Update service file paths if needed

## Advantages of This Approach

### vs. JSON Conversion
- **No conversion overhead**: Direct parsing is faster
- **Preserves all data**: No risk of losing information
- **Maintains structure**: Original XML relationships are preserved
- **No additional dependencies**: Uses browser-native APIs

### vs. Pure XML
- **Type safety**: Full TypeScript support with interfaces
- **IntelliSense**: IDE autocomplete and error checking
- **Easier manipulation**: Structured data objects instead of DOM elements
- **Better maintainability**: Clear data contracts

## Performance Considerations

- **Large files**: The parser handles large XML files efficiently
- **Memory usage**: Data is parsed once and cached in memory
- **Network**: Files are loaded via HTTP client with proper error handling
- **Caching**: Consider implementing caching for frequently accessed data

## Error Handling

The service includes comprehensive error handling:

```typescript
this.battleScribeService.loadCatalogue().subscribe({
  next: (data) => {
    // Handle successful data load
  },
  error: (err) => {
    // Handle errors (network, parsing, etc.)
    console.error('Failed to load data:', err.message);
  }
});
```

## Extending the Service

To add support for additional BattleScribe elements:

1. **Add interfaces** for new data structures
2. **Extend parsing methods** in the service
3. **Add utility methods** for common operations
4. **Update error handling** for new scenarios

## Testing

The implementation includes example components that demonstrate:
- Basic data loading
- Filtering and searching
- Error handling
- Multiple data type loading

Run the application to see the examples in action.

## Browser Compatibility

This implementation uses standard browser APIs:
- `DOMParser` (supported in all modern browsers)
- `HttpClient` (Angular standard)
- `querySelector` and `querySelectorAll` (widely supported)

## Future Enhancements

Potential improvements:
- **Caching layer** for better performance
- **Lazy loading** for large datasets
- **Validation** of XML structure
- **Export functionality** to other formats
- **Real-time updates** for dynamic data
