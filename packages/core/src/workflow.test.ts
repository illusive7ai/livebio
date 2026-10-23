import { describe, expect, it } from 'vitest';
import { ACTION_REF, workflowYaml } from './workflow';

describe('the generated workflow', () => {
  it('uses a release tag, never a moving branch', () => {
    expect(ACTION_REF).toMatch(/^illusive7ai\/livebio@v\d+\.\d+\.\d+$/);
    expect(workflowYaml()).toContain(`uses: ${ACTION_REF}`);
    expect(workflowYaml()).not.toMatch(/@(main|master|latest)\b/);
  });

  it('can be started by hand, runs on a schedule, and may only write to the repository it is in', () => {
    const yaml = workflowYaml('5 4 * * *');
    expect(yaml).toContain('workflow_dispatch:');
    expect(yaml).toContain('cron: "5 4 * * *"');
    expect(yaml).toContain('contents: write');
    expect(yaml).not.toMatch(/permissions:[\s\S]*(actions|packages|pull-requests|id-token): write/);
  });

  it('hands the Action the built-in token, never a stored secret of its own', () => {
    expect(workflowYaml()).toContain('token: ${{ secrets.GITHUB_TOKEN }}');
  });

  it('commits only when something changed', () => {
    expect(workflowYaml()).toContain('git diff --cached --quiet');
  });
});
