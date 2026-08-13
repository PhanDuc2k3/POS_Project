import { renderDemoSection } from '../sections/DemoSection.js';
import { renderFeaturesSection } from '../sections/FeaturesSection.js';
import { renderFormsSection } from '../sections/FormsSection.js';
import { renderHeroSection } from '../sections/HeroSection.js';
import { renderMetricsSection } from '../sections/MetricsSection.js';
import { renderPricingSection } from '../sections/PricingSection.js';
import { renderSolutionsSection } from '../sections/SolutionsSection.js';
import { renderWorkflowSection } from '../sections/WorkflowSection.js';

export function renderHomePage(state) {
  return `
    <main>
      ${renderHeroSection()}
      ${renderMetricsSection()}
      ${renderFeaturesSection()}
      ${renderSolutionsSection()}
      ${renderWorkflowSection()}
      ${renderDemoSection()}
      ${renderPricingSection()}
      ${renderFormsSection(state)}
    </main>
  `;
}
