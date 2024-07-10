import LookupAMSDataMarker from "./scan-strategies/LookupAMSDataMarker";
import LookupEmailServicesDataMarker from "./scan-strategies/LookupEmailServicesDataMarker";
import LookupPersonServicesDataMarker from "./scan-strategies/LookupPersonServicesDataMarker";
import LookupPhoneServicesDataMarker from "./scan-strategies/LookupPhoneServicesDataMarker";

class Scanner {
  integrator

  constructor(integrator) {
      this.strategies = [
        new LookupAMSDataMarker(),
        new LookupPersonServicesDataMarker(),
        new LookupPhoneServicesDataMarker(),
        new LookupEmailServicesDataMarker()
      ];
      this.intervalId = null;
      this.scanInterval = 10;
      this.integrator = integrator;
  }

  addStrategy(strategy) {
      this.strategies.push(strategy);
  }

  useIntegrator(integrator) {
      this.integrator = integrator;
  }

  start() {
      if (this.intervalId !== null) {
          console.warn('Scanner is already running.');
          return;
      }

      this.intervalId = window.setInterval(() => {
          this.scan();
      }, this.scanInterval);
  }

  stop() {
      if (this.intervalId !== null) {
          window.clearInterval(this.intervalId);
          this.intervalId = null;
      }
  }

  scan() {
      this.strategies.forEach(strategy => {
        strategy.execute(this.integrator);
      });
  }
}

export default Scanner