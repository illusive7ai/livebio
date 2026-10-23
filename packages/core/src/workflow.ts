/** The Action users run in their profile repository. Switch to a version tag once releases exist. */
export const ACTION_REF = 'illusive7ai/livebio@main';

/** Workflow file that refreshes the profile every day. */
export function workflowYaml(cron = '17 3 * * *'): string {
  return `name: livebio

on:
  schedule:
    - cron: "${cron}"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ${ACTION_REF}
        with:
          token: \${{ secrets.GITHUB_TOKEN }}
      - name: Commit changes
        run: |
          git config user.name "livebio[bot]"
          git config user.email "livebio[bot]@users.noreply.github.com"
          git add -A
          if git diff --cached --quiet; then
            echo "Nothing to update."
          else
            git commit -m "Update profile README"
            git push
          fi
`;
}
