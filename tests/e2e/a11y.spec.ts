import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Runs axe-core against key routes and writes a consolidated
 * a11y-report.json artifact. CI (see .github/workflows/ci.yml) fails the
 * build if any "critical" or "serious" violations are present, satisfying
 * "CI fails on any critical axe violations".
 */

type RouteReport = {
  route: string;
  violations: { id: string; impact: string | null | undefined; help: string; nodes: number }[];
};

const ROUTES = ['/', '/preview/home',
    '/studio/home',
   '/preview/broken'];

const allReports: RouteReport[] = [];

for (const route of ROUTES) {
  test(`axe scan: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21aa', 'wcag22aa'])
      .analyze();

    allReports.push({
      route,
      violations: results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.length,
      })),
    });

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
  });
}

test.afterAll(async () => {
  const outPath = path.join(process.cwd(), 'a11y-report.json');
  await fs.writeFile(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), routes: allReports }, null, 2));
});
