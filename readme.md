# Endereco JavaScript-SDK

## Einleitung

Endereco bietet eine API über welche man Adressen prüfen lassen kann. Als Ergebnis einer solchen Prüfung bekommt man zum
einem eine Liste von Statuscodes, welche die Probleme bei der Adresse beschreiben, zum anderen aber eine oder 
mehrere Adresskorrekturvorschläge.

Die Antwort der API ist als JSON formuliert und wäre für einen normalen Nutzer nicht zu gebrauchen. Deswegen gibt es 
die ´js-sdk´. 

Unser JavaScript SDK dient als Schnittstelle zwischen dem Nutzer und der API und stellt die Ergebnisse der Prüfung in
versäntlichen und menschenlesbarer Form dar, z.b. als Modal.

## Installation

Im `/dist` Verzeichnis liegt eine kompilierte und minifizierte Datei, die sofort eingesetzt werden kann. Dafür kann man 
sie ins eigene Projekt kopieren und im Footer des HTML Dokuments einbauen:

```html
<script
		defer
		async
		src="dist/endereco.min.js"
		onload="if(typeof enderecoLoadAMSConfig === 'function'){enderecoLoadAMSConfig();}"
></script>
```
Diese Art und Weise lässt die Datei zum einem ladezeitschonend Laden, zum anderen wird über das Callback `enderecoLoadAMSConfig` der Zeitpunkt des Ladens der 
Datei erfasst. In diesem Callback sollen alle Konfigurationen landen, die davon ausgehen, dass ein Endereco objekt bereits da ist.

Zum Beispiel:

```html
<script>
    /**
     * Zuerst wird geprüft, ob EnderecoIntegrator da ist. Dieser Code braucht man für die enderecoInitAMS Funktion unten.
     */
	if (undefined === window.EnderecoIntegrator) {
            window.EnderecoIntegrator = {};
        }
        if (!window.EnderecoIntegrator.onLoad) {
            window.EnderecoIntegrator.onLoad = [];
        }

    /**
     * Hilfsfunktion, mit welcher man das Endereeco AMS an die entsprechende Form einbinden kann.
     * Diese Funktion prüft, ob die EnderecoIntegrator.initAMS bereits da ist. Wenn nicht, dann wird der Funktionsaufruf
     * für später im EnderecoIntegrator.onLoad gespeichert.
     * 
     * @param prefix
     * @param config
     */
	function enderecoInitAMS(prefix, config) {
        if (undefined !== window.EnderecoIntegrator.initAMS) {
            window.EnderecoIntegrator.initAMS(prefix, config);
        } else {
            window.EnderecoIntegrator.onLoad.push(function () {
                window.EnderecoIntegrator.initAMS(prefix, config);
            });
        }
    }

	/**
     * Konfiguration des EnderecoIntegrator Objekts.
 	 */
	function enderecoLoadAMSConfig() {

		/**
         * Fall man möchte, dass ein Land automatische ausgewählt wird, kann man dieses Feature hier einstellen.
		 * @type {string}
		 */
		window.EnderecoIntegrator.defaultCountry = 'DE';
		window.EnderecoIntegrator.defaultCountrySelect = true;

		/**
         * Darüber wird im <body> eine Endereco Theme Klasse gesetzt, welche nützlich ist um die Endereco Styles anzupassen.
		 * @type {string}
		 */
		window.EnderecoIntegrator.themeName = 'my-theme';

		/**
         * Hier wird definiert wo die Proxydatei liegt, wohin die Proxy die Anfragen weiterleiten soll und welcher API-Key verwendet werden muss.
		 * @type {string}
		 */
		window.EnderecoIntegrator.config.agentName = "Mein tolles Client v1.0.0";
		window.EnderecoIntegrator.config.apiUrl = 'http://localhost:8000/proxyfile';
		window.EnderecoIntegrator.config.remoteApiUrl = 'http://endereco-service.de/rpc/v1';
        window.EnderecoIntegrator.config.apiKey = ''; // Hier kommt Dein API Key.

		/**
         * Erlaubt die Ausgabe von diversen technischen Texten in der Browserconsole. Kann für Debug nützlich sein.
		 * @type {boolean}
		 */
		window.EnderecoIntegrator.config.showDebugInfo = false;

		/**
         * Bestimmt wann eine Adressprüfung ausgeführt werden soll:
         *   onblur -- beim Verlassen der Adresse
         *   onsubmit -- beim Absenden der Form
		 * @type {boolean}
		 */
		window.EnderecoIntegrator.config.trigger.onblur = true;
        window.EnderecoIntegrator.config.trigger.onsubmit = true;

		/**
         * Automatische Übernahme der Autocomplete vorschlägen, falls sie eindeutig sind.
		 * @type {boolean}
		 */
		window.EnderecoIntegrator.config.ux.smartFill = true;

		/**
         * Sollte sicherheitshalber gesetzt werden, wird aber in der Zukunft entfernt.
         * Beschließt, ob ein BEstandskunde geprüft werden muss, bzw. ob das Modal nach einer Prüfung erscheinen soll.
         * Da die Prüfung nun serverseitig erfolgt, ist diese Einstellung nicht mehr relevant.
         * @deprecated
		 * @type {boolean}
		 */
		window.EnderecoIntegrator.config.ux.checkExisting = true;

		/**
         * Soll das Absenden der Form fortgesetzt werden, nachdem ein Nutzer auf "Adresse übernehmen" 
         * im Korrekturmodal gelickt hat?
		 * @type {boolean}
		 */
		window.EnderecoIntegrator.config.ux.resumeSubmit = true;

		/**
         * Beschließt, ob das Standard CSS von Endereco eingebaut werden soll. Das CSS ist ein Bestandteil der JS-Datei.
		 * @type {boolean}
		 */
		window.EnderecoIntegrator.config.ux.useStandardCss = true;

        /**
         * Hängt die CSS-Datei aus dem angegebenen Pfad an. Wenn Sie keinen bestimmten Wert definieren, wird die Datei vom Standardspeicherort heruntergeladen.
         * @type {boolean}
         */
        window.EnderecoIntegrator.config.ux.cssFilePath = 'https://mydomain.com/endereco.css';

		/**
         * Wenn aktiv, wird Email Prüfung Fehlertexte unter dem Email Eingabefeld rendern.
		 * @type {boolean}
		 */
		window.EnderecoIntegrator.config.ux.showEmailStatus = true;

		/**
         * Soll das Adressmodal über Close-Icon schließbar sein?
		 * @type {boolean}
		 */
		window.EnderecoIntegrator.config.ux.allowCloseModal = true;

		/**
         * Soll ein Nutzer, wenn er seine fehlerhafte Schreibweise bevorzugt, die Auswahl nochmal mit einer Checkbox bestätigen?
		 * @type {boolean}
		 */
		window.EnderecoIntegrator.config.ux.confirmWithCheckbox = true;

		/**
         * Soll die Felderreihenfolde automatische angepasst werden?
         * Die Reihenfolge wäre: Land Postleitzahl Ort Straße Hausnummer Zusatzinfos.
		 * @type {boolean}
		 */
		window.EnderecoIntegrator.config.ux.changeFieldsOrder = true;

		/**
         * Css Klassen für primärer und sekundärer Buttons, damit das Adressmodal das Look-n-Feel der Website
         * übernehmen kann.
		 * @type {string}
		 */
		window.EnderecoIntegrator.config.templates.primaryButtonClasses = 'btn btn-primary btn-lg';
        window.EnderecoIntegrator.config.templates.secondaryButtonClasses = 'btn btn-secondary btn-lg';

		/**
         * Diverse Texte in Modalen und für Fehlermeldungen.
		 * @type {{useSelected: string, popupHeadlines: {general_address: string, billing_address: string, shipping_address: string}, yourInput: string, ourSuggestions: string, mistakeNoPredictionSubline: string, confirmAddress: string, popUpSubline: string, confirmMyAddressCheckbox: string, statuses: {email_not_correct: string, street_name_needs_correction: string, locality_needs_correction: string, email_syntax_error: string, building_number_not_found: string, country_code_needs_correction: string, building_number_is_missing: string, email_cant_receive: string, postal_code_needs_correction: string, email_no_mx: string}, notFoundSubline: string, editYourInput: string, warningText: string, popUpHeadline: string, editAddress: string}}
		 */
		window.EnderecoIntegrator.config.texts = {
            popUpHeadline: 'Adresse prüfen',
            popUpSubline: 'Die von Ihnen eingegebene Adresse scheint nicht korrekt oder unvollständig zu sein. Bitte wählen Sie die korrekte Adresse aus.',
            mistakeNoPredictionSubline: 'Ihre Adresse konnte nicht verifiziert werden. Bitte prüfen Sie Ihre Eingabe und ändern oder bestätigen sie.',
            notFoundSubline: 'Ihre Adresse konnte nicht verifiziert werden. Bitte prüfen Sie Ihre Eingabe und ändern oder bestätigen sie.',
            confirmMyAddressCheckbox: 'Ich bestätige, dass meine Adresse korrekt und zustellbar ist.',
            yourInput: 'Ihre Eingabe:',
            editYourInput: '(bearbeiten)',
            ourSuggestions: 'Unsere Vorschläge:',
            useSelected: 'Auswahl übernehmen',
            confirmAddress: 'Adresse bestätigen',
            editAddress: 'Adresse bearbeiten',
            warningText: 'Falsche Adressen können zu Problemen in der Zustellung führen und weitere Kosten verursachen.',
            popupHeadlines: {
                general_address: 'Adresse prüfen',
                billing_address: 'Rechnungsadresse prüfen',
                shipping_address: 'Lieferadresse prüfen',
            },
            statuses: {
                email_not_correct: 'Die E-Mail Adresse scheint nicht korrekt zu sein.',
                email_cant_receive: 'Das E-Mail Postfach ist nicht erreichbar.',
                email_syntax_error: 'Prüfen Sie die Schreibweise.',
                email_no_mx: 'Die E-Mail Adresse existiert nicht. Prüfen Sie die Schreibweise.',
                building_number_is_missing: 'Keine Hausnummer enthalten.',
                building_number_not_found: 'Diese Hausnummer wurde nicht gefunden.',
                street_name_needs_correction: 'Die Schreibweise der Straße ist fehlerhaft.',
                locality_needs_correction: 'Die Schreibweise des Ortes ist fehlerhaft.',
                postal_code_needs_correction: 'Die PLZ ist ungültig.',
                country_code_needs_correction: 'Die eingegebene Adresse wurde in einem anderen Land gefunden.'
            }
        };

		/**
         * Welche Endereco Services sollen aktiv sein?
		 * @type {{ams: boolean, personService: boolean, emailService: boolean}}
		 */
		window.EnderecoIntegrator.activeServices = {
            ams: true,
            emailService: true,
            personService: true
        }

		/**
         * Beispieldaten für die Country ID Auflösung.
         * Bei manchen Systemen wird hinter einem Land in <select> eine interne ID hinterlegt.
         * Diese wäre für Adressprüfung nutzlos. Damit für das ausgewählte Land ein richtiger Country Code
         * gespeichert werden kann, gibt es die Matching Funktionen.
		 * @type {{"1": string, "2": string, "3": string}}
		 */
		window.EnderecoIntegrator.countryMapping = {
            '1': 'DE',
            '2': 'AT',
            '3': 'CH'
        };
        window.EnderecoIntegrator.countryReverseMapping = {
            'DE': 1,
            'AT': 2,
            'CH': 3
        };
        // Country matching functions.
        EnderecoIntegrator.resolvers.countryCodeWrite = function (value) {
            return new Promise(function (resolve, reject) {
                resolve(window.EnderecoIntegrator.countryReverseMapping[value]);
            });
        }
        EnderecoIntegrator.resolvers.countryCodeRead = function (value) {
            return new Promise(function (resolve, reject) {
                resolve(window.EnderecoIntegrator.countryMapping[value]);
            });
        }

        // Execute all function that have been called throughout the page.
        window.EnderecoIntegrator.onLoad.forEach(function (callback) {
            callback();
        });

        window.EnderecoIntegrator.ready = true;
    }
</script>
```

Wenn die Konfiguration erfolgt hat, kann das Endereco AMS an die Form angeschloßen werden. Dafür soll die funktion `initAMS` genutzt werden.

Zum Beispiel:

```html
<script>
    enderecoInitAMS({
        countryCode: '#country',
        postalCode: '#zip',
        locality: '#loc',
        streetFull: '',
        streetName: '#street',
        buildingNumber: '#street_n',
        additionalInfo: '#address_1',
        addressStatus: '[name="enderecoamsstatus"]',
        addressTimestamp: '[name="enderecoamsts"]',
        addressPredictions: '[name="enderecoamsapredictions"]',
    }, {
        name: 'irgendein_name_am_besten_mit_underscores',
        addressType: 'general_address' // Möglich sind noch: "billing_address" und "shipping_address"
    });
</script>
```
## Testumgebung für Endereco JavaScript-SDK & Endereco Webservices

Diese Anwendung dient als Testumgebung für die Entwicklung und das Testen des Endereco JavaScript-SDK und der Endereco Webservices. Sie ermöglicht es Entwicklern und Testern, verschiedene Anwendungsfälle zu simulieren und zu überprüfen, wie die Software bzw. die Serveranfragen unter verschiedenen Bedingungen reagieren.

### Nutzung der Testumgebung

Führen sie den folgenden Befehl im Hauptverzeichnis des js-sdk aus:

```bash
npm run demo
```

Dies startet den Server und öffnet automatisch Ihren Standardbrowser. Sie können dann auf `localhost:8888` navigieren, um eine Liste aller verfügbaren Testfälle zu sehen. Klicken Sie auf den Link zu einem Testfall, um ihn anzuzeigen.

Alternativ können Sie die Browsersync Implementierung nutzen.

### Browsersync Integration

Browsersync wurde in das Demo-Skript integriert, um eine schnellere und effizientere Entwicklung zu ermöglichen. Wenn Sie `npm run demo` ausführen, startet Browsersync automatisch und öffnet Ihren Standardbrowser. Es wird ein lokaler Server auf `localhost:3000` erstellt, auf dem die Demo läuft.

Browsersync verfolgt alle Änderungen in Ihren Dateien. Wenn Sie eine Datei speichern, wird die Webseite automatisch neu geladen, so dass Sie Ihre Änderungen sofort sehen können. Dies gilt für alle `.js`, `.css` und `.html` Dateien im `demo` Verzeichnis.

Um die Browsersync-Sitzung zu beenden, drücken Sie einfach `Ctrl+C` in Ihrem Terminal.

Die Anwendung kann aber weiterhin auf `localhost:8888` ohne Browsersync genutzt werden.

### Demonstration am Beispiel "Example"

Zum Beispiel wird der Link zu "example" Sie zu localhost:8888/use-cases/example/example.html führen und die Datei example.html aus dem Verzeichnis demo/use-cases/example/ anzeigen.

Hier haben wir bereits eine Übersicht aller Funktionen der Endereco Webservices in einem überschtlichen Formular für Sie zusammengefasst. Nach der Eingabe eines gültigen API-Sclüssels können sie die Endereco Webservices nach Belieben testen. Wenn Sie noch keinen API-Schlüssel besitzen, finden Sie alle weiterführenden Informationen und Kontaktdaten auf https://www.endereco.de/. 

### Erstellen weiterer Testfälle

Um weitere Testfälle zu erstellen, erstellen Sie einen neuen Ordner unter `use-cases`. Der Name des Ordners sollte den Testfall beschreiben. Innerhalb dieses Ordners erstellen Sie die benötigten Dateien (z.B. HTML, JS, CSS).

Der Startpunkt des Testfalls sollte in einer HTML-Datei mit dem gleichen Namen wie der Ordner sein. Zum Beispiel, wenn Ihr Testfall "new-test-case" heißt, sollten Sie eine Datei namens `new-test-case.html` erstellen, denn dort beginnt die Anwendung.

Nachdem Sie den neuen Testfall erstellt haben, aktualisiert sich der Server selbständig, sie müssen nur den Browser aktualisieren. starten Sie den Server wie oben beschrieben. Ihr neuer Testfall sollte nun in der Liste der verfügbaren Testfälle auf `localhost:8888` erscheinen. Klicken Sie auf den Link zu Ihrem Testfall, um ihn anzuzeigen.

### Serveranfragen / Proxy

Die Anbindung an den Endereco API Server ist bereits in der App eingerichtet, so das hier keine weiteren Modifikationen notwendig sein sollten. Antworten werden automatisch an den Startpunkt Ihres spezifischen Testfalls weitergeleitet. Wenn Ihr Testfall wie im Beispiel "new-test-case" heißt, werden Antworten automatisch an `new-test-case.html` übermittelt.