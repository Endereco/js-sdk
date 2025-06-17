# Endereco JavaScript SDK

> A comprehensive JavaScript SDK for integrating Endereco address validation workflows into web applications.

## Overview

The Endereco JavaScript SDK provides seamless integration of address validation, email verification, phone validation, and person data services into web applications. Unlike standalone applications, this SDK is designed to be bundled into existing systems, making address validation workflows accessible through simple JavaScript APIs.

### Core Services

- **Address Validation (AMS)** - Real-time address verification and correction with autocomplete
- **Email Services** - Email address validation and deliverability checking
- **Phone Services** - Phone number format validation and type verification
- **Person Services** - Name validation and formatting for form data

## Installation

### NPM Installation

```bash
npm install @endereco/js-sdk
```

### Direct Integration

For direct browser integration, use the pre-built distribution files:

```html
<script
    defer
    async
    src="dist/endereco.min.js"
></script>
```

The `defer` and `async` attributes ensure optimal loading performance.

## Browser Support

The SDK supports modern browsers based on the following configuration:

- **Coverage**: >1% market share, last 2 versions
- **Exclusions**: Internet Explorer 9 and below
- **Polyfills**: Automatic polyfill injection for legacy browser compatibility

## Quick Start

### Basic Address Validation Setup

1. **Initialize the SDK**:

```javascript
// Ensure EnderecoIntegrator is available
if (undefined === window.EnderecoIntegrator) {
    window.EnderecoIntegrator = {};
}
if (!window.EnderecoIntegrator.onLoad) {
    window.EnderecoIntegrator.onLoad = [];
}

// Helper function for SDK initialization
async function enderecoInitAMS(selectors, config) {
    if (window.EnderecoIntegrator.ready) {
        window.EnderecoIntegrator.initAMS(selectors, config);
    } else {
        window.EnderecoIntegrator.onLoad.push(async () => {
            window.EnderecoIntegrator.initAMS(selectors, config);
        });
    }
}
```

2. **Configure the SDK**:

```javascript
function enderecoLoadAMSConfig() {
    window.EnderecoIntegrator.defaultCountry = 'DE';
    window.EnderecoIntegrator.config.apiKey = 'your-api-key';
    window.EnderecoIntegrator.config.apiUrl = 'your-proxy-endpoint';
    window.EnderecoIntegrator.config.remoteApiUrl = 'https://endereco-service.de/rpc/v1';
    
    // Enable services
    window.EnderecoIntegrator.activeServices = {
        ams: true,
        emailService: true,
        personService: true,
        phs: true
    };
}
```

The function `enderecoLoadAMSConfig` is usually called at the end of bundle file ensuring both the bundle file was properly loaded and the Integrator exists. e.g.

```javascript
const waitForConfig = setInterval(() => {
    if (typeof enderecoLoadAMSConfig === 'function') {
        enderecoLoadAMSConfig();
        clearInterval(waitForConfig);
    }
}, 10);
```

3. **Bind to Form Fields**:

```javascript
enderecoInitAMS({
    countryCode: '#country',
    postalCode: '#zip',
    locality: '#city',
    streetName: '#street',
    buildingNumber: '#house-number',
    additionalInfo: '#apartment',
    addressStatus: '[name=\"endereco-status\"]',
    addressTimestamp: '[name=\"endereco-timestamp\"]',
    addressPredictions: '[name=\"endereco-predictions\"]'
}, {
    name: 'billing_address',
    addressType: 'billing_address'
});
```

## Available Scripts

### Development Commands

- **`npm run build`** - Complete production build including styles and assets
- **`npm run build-styles`** - Compile SCSS themes and copy to distribution
- **`npm run demo`** - Start development server
- **`npm run copy`** - Internal untility script to copy built JavaScript assets to demo folder
- **`npm run copy-styles`** - Internal untility script to copy built CSS assets to demo folder

### Development Workflow

The demo environment provides real-time development with automatic browser refresh:

```bash
npm run demo
```

This command:
1. Starts Express server on `localhost:8888`
2. Launches BrowserSync proxy on `localhost:3000`
3. Watches for changes in demo files
4. Automatically reloads browser on file changes

## Integration Examples

### Real-World Implementation: Shopware 6

The [shopware 6 plugin repository](https://github.com/Endereco/endereco-shopware6-client) contains a complete Shopware 6 plugin implementation demonstrating:

- Frontend integration with Twig templates
- Backend PHP service integration
- Webpack build configuration for e-commerce environments
- Multi-language support and customization

### Demo Use Cases

The `demo/use-cases/` directory provides working examples:

- **`example/`** - Comprehensive demonstration of all SDK features
- **`miniconfig/`** - Minimal configuration setup
- **`test/`** - Testing scenarios and edge cases

Access examples via the demo server:
- Main demo: `http://localhost:8888/`
- Example case: `http://localhost:8888/use-cases/example/`

## SDK Architecture

### Core Components

- **`modules/integrator.js`** - Main integration interface
- **`modules/ams.js`** - Address validation service
- **`modules/emailservices.js`** - Email validation service
- **`modules/phoneservices.js`** - Phone validation service
- **`modules/personservices.js`** - Person data validation
- **`modules/subscriber.js`** - Event handling system, used primarily for DOMElement to JavaScript object value synchronisation

### Extension System

#### Field Extensions
Located in `modules/extensions/fields/`:
- `CountryCodeExtension.js` - Country field handling
- `PostalCodeExtension.js` - Postal code validation
- `StreetNameExtension.js` - Street name processing
- `EmailExtension.js` - Email field integration
- And more for comprehensive form field support

#### Session Management
- `SessionExtension.js` - Session tracking for accounting

### Template System

The SDK includes a flexible template system:

- **`templates/`** - UI component templates
- **`themes/`** - SCSS styling themes

## Configuration

### Core Configuration Options

```javascript
window.EnderecoIntegrator.config = {
    apiKey: 'your-api-key',
    apiUrl: 'your-proxy-endpoint',
    remoteApiUrl: 'https://endereco-service.de/rpc/v1',
    
    trigger: {
        onblur: true,    // Validate on field blur
        onsubmit: true   // Validate on form submit
    },
    
    ux: {
        smartFill: true,              // Auto-complete obvious matches
        resumeSubmit: true,           // Continue form submission after validation
        useStandardCss: true,         // Include default styling
        allowCloseModal: true,        // Allow modal dismissal
        confirmWithCheckbox: true,    // Require confirmation for corrections
        changeFieldsOrder: true       // Optimize field order for validation
    }
};
```
...and more. See the integration examples.

### Service Activation

```javascript
window.EnderecoIntegrator.activeServices = {
    ams: true,           // Address validation
    emailService: true,  // Email validation
    personService: true, // Person data validation
    phs: true           // Phone validation
};
```

### Customization Options

- **Button styling** - Custom CSS classes for modal buttons to recreate the systems look-n-feel
- **Text localization** - Override all user-facing text with text coming from the host system
- **Country/subdivision mapping** - Custom country code handling with mapping tables from the host system
- **Validation triggers** - Configure when validation occurs

## API Reference

### Main Integration Methods

#### `initAMS(selectors, config)`
Initialize address validation for form fields.

**Parameters:**
- `selectors` (Object) - CSS selectors for form fields
- `config` (Object) - Instance-specific configuration

#### `initEmailServices(selectors, config)`
Enable email validation for specified fields.

#### `initPhoneServices(selectors, config)`
Activate phone number validation and formatting.

#### `initPersonServices(selectors, config)`
Enable person data validation (names, titles, salutations).

### Event System

The SDK provides event hooks for custom integration:
- Form validation events
- Modal display events
- API response events
- User interaction events

### Resolver Functions

Custom field value processing:
```javascript
EnderecoIntegrator.resolvers.countryCodeRead = function(value) {
    return Promise.resolve(countryMapping[value]);
};

EnderecoIntegrator.resolvers.countryCodeWrite = function(value) {
    return Promise.resolve(reverseCountryMapping[value]);
};
```

Those are needed to properly translate some host system values, like specific ID's of countries from a `<select>` element 
to universally used country codes.

## Build System

### Dependencies

- **Babel** - ES6+ transpilation with preset-env
- **Webpack** - Module bundling and asset management
- **SASS** - CSS preprocessing with theme support
- **Polyfills** - Browser compatibility (classlist, custom-event, promise)

### Build Configuration

The build process:
1. Transpiles modern JavaScript to browser-compatible code
2. Bundles modules into single distribution file
3. Processes SCSS themes to CSS
4. Includes necessary polyfills
5. Minifies output for production

### Asset Management

- JavaScript bundles to `dist/endereco.min.js`
- CSS themes to `dist/endereco.min.css`
- Demo assets automatically updated via copy scripts
- Host integrations usually have its own webpack configurations, where paths are configured system specific

## Testing

### Manual Testing via Demo

Access the demo environment to test integration scenarios:

1. Start demo server: `npm run demo`
2. Navigate to `localhost:3000`
3. Select use case to test
4. Enter API key in provided field
5. Test validation scenarios

### Integration Testing

The demo includes various test scenarios:
- Multiple address forms on single page
- Different validation triggers
- Custom styling applications
- Service combinations

We also sometimes symlink or just hard copy the file to one of the plugin, build it there and test manually in the context of a system integration, which helps find issues not visible in the demo integration (like problems with AJAX formulars in Shopware 6)

## Support and Resources

- **GitHub Repository**: [https://github.com/Endereco/js-sdk](https://github.com/Endereco/js-sdk)
- **Issue Tracking**: [https://github.com/Endereco/js-sdk/issues](https://github.com/Endereco/js-sdk/issues)
- **API Documentation**: Available at endereco.de
- **Technical Support**: support@endereco.de

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines, coding standards, and pull request processes.
