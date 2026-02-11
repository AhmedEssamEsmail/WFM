# CI/CD Monitoring Setup

## Overview

This document describes how to monitor the CI/CD pipeline for the WFM application, including tracking build success rates, build times, test pass rates, and creating dashboards.

## Metrics to Track

### 1. Build Success Rate

**Definition**: Percentage of builds that complete successfully

**Target**: ≥95%

**Calculation**: (Successful builds / Total builds) × 100

**Why it matters**: Indicates overall pipeline health and code quality

### 2. Average Build Time

**Definition**: Mean time for a complete CI run

**Target**: <5 minutes

**Calculation**: Sum of all build times / Number of builds

**Why it matters**: Affects developer productivity and feedback speed

### 3. Test Pass Rate

**Definition**: Percentage of test runs that pass all tests

**Target**: ≥98%

**Calculation**: (Passing test runs / Total test runs) × 100

**Why it matters**: Indicates test reliability and code stability

### 4. Test Coverage

**Definition**: Percentage of code covered by tests

**Target**: ≥70% overall, ≥90% critical paths

**Why it matters**: Indicates test comprehensiveness

## Data Collection

### GitHub Actions Workflow Data

GitHub Actions provides built-in metrics:

**Access Workflow Runs**:
1. Go to repository on GitHub
2. Click "Actions" tab
3. View workflow runs and statistics

**API Access**:
```bash
# Get workflow runs
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/actions/runs

# Get workflow run details
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/actions/runs/RUN_ID
```

### Metrics to Extract

From each workflow run:
- `id` - Unique run identifier
- `status` - completed, in_progress, queued
- `conclusion` - success, failure, cancelled
- `created_at` - Start time
- `updated_at` - End time
- `run_started_at` - Actual start time
- Duration - Calculate from timestamps

## Monitoring Setup

### Option 1: GitHub Actions Dashboard (Built-in)

**Pros**:
- No setup required
- Built into GitHub
- Real-time updates

**Cons**:
- Limited customization
- No historical trends
- No alerting

**Access**:
1. Go to repository → Actions tab
2. View workflow runs
3. Filter by status, branch, etc.

### Option 2: GitHub Insights (Built-in)

**Pros**:
- Free with GitHub
- Shows trends over time
- No setup required

**Cons**:
- Limited metrics
- No custom dashboards
- No alerting

**Access**:
1. Go to repository → Insights tab
2. Click "Actions" in sidebar
3. View workflow statistics

### Option 3: Custom Dashboard (Recommended)

**Tools**:
- Grafana (visualization)
- Prometheus (metrics storage)
- GitHub Actions exporter

**Setup**:
1. Deploy Prometheus
2. Deploy GitHub Actions exporter
3. Configure Grafana dashboards
4. Set up alerts

**Pros**:
- Fully customizable
- Historical data
- Alerting capabilities
- Multiple repositories

**Cons**:
- Requires setup and maintenance
- Additional infrastructure

### Option 4: Third-Party Services

**Options**:
- Datadog
- New Relic
- Honeycomb
- Sentry Performance

**Pros**:
- Easy setup
- Professional dashboards
- Built-in alerting
- Support

**Cons**:
- Cost
- External dependency

## Dashboard Design

### Key Metrics Dashboard

**Metrics to Display**:
1. Build success rate (last 7 days)
2. Average build time (last 7 days)
3. Test pass rate (last 7 days)
4. Test coverage percentage
5. Failed builds (last 24 hours)
6. Slowest builds (last 7 days)

**Visualizations**:
- Line charts for trends
- Gauges for current values
- Tables for recent failures
- Heatmaps for build times by hour

### Example Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  CI/CD Pipeline Health                                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ Success  │  │  Build   │  │   Test   │  │ Coverage ││
│  │   Rate   │  │   Time   │  │   Pass   │  │          ││
│  │   96%    │  │  4.2min  │  │   98%    │  │   72%    ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
│                                                           │
│  Build Success Rate (Last 7 Days)                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │                                                       ││
│  │  100% ┤                                              ││
│  │       │     ╭─╮                                      ││
│  │   95% ┤   ╭─╯ ╰─╮                                    ││
│  │       │ ╭─╯     ╰─╮                                  ││
│  │   90% ┼─╯         ╰─────────────────────────────    ││
│  │       │                                               ││
│  │       └───────────────────────────────────────────   ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  Recent Failures                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Time    │ Branch  │ Reason          │ Duration      ││
│  ├─────────┼─────────┼─────────────────┼───────────────┤│
│  │ 2h ago  │ main    │ Test failure    │ 4.5min        ││
│  │ 5h ago  │ feat/x  │ Lint error      │ 2.1min        ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Alerting

### Alert Conditions

**Critical Alerts** (Immediate notification):
- Build success rate drops below 90%
- Main branch build fails
- Test pass rate drops below 95%
- Build time exceeds 10 minutes

**Warning Alerts** (Daily digest):
- Build success rate drops below 95%
- Average build time exceeds 5 minutes
- Test coverage drops below 70%
- More than 3 failures in 24 hours

### Alert Channels

**Slack Integration**:
```yaml
# .github/workflows/ci.yml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "CI Build Failed",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Build Failed*\nBranch: ${{ github.ref }}\nCommit: ${{ github.sha }}"
            }
          }
        ]
      }
```

**Email Notifications**:
- Configure in GitHub repository settings
- Settings → Notifications → Actions

**GitHub Issues**:
- Auto-create issue on repeated failures
- Use GitHub Actions workflow

## Reporting

### Daily Report

**Contents**:
- Builds run: X
- Success rate: Y%
- Average build time: Z minutes
- Failed builds: List with links
- Test coverage: Current percentage

**Distribution**:
- Slack channel (#wfm-ci)
- Email to team
- Dashboard

### Weekly Report

**Contents**:
- Week-over-week trends
- Top failure reasons
- Slowest builds
- Test coverage changes
- Action items

**Distribution**:
- Team meeting
- Email to stakeholders
- Wiki/documentation

### Monthly Report

**Contents**:
- Monthly trends
- Improvements made
- Issues identified
- Goals for next month
- ROI analysis

**Distribution**:
- Management review
- Team retrospective
- Documentation

## Continuous Improvement

### Review Process

**Weekly**:
- Review failed builds
- Identify patterns
- Create improvement tasks
- Update documentation

**Monthly**:
- Review all metrics
- Identify bottlenecks
- Plan optimizations
- Update targets

### Optimization Opportunities

**Reduce Build Time**:
- Cache dependencies
- Parallelize jobs
- Optimize test execution
- Use faster runners

**Improve Success Rate**:
- Fix flaky tests
- Improve error messages
- Add pre-commit hooks
- Better documentation

**Increase Coverage**:
- Identify gaps
- Write missing tests
- Enforce coverage thresholds
- Review in PRs

## Implementation Checklist

### Phase 1: Basic Monitoring
- [ ] Enable GitHub Actions insights
- [ ] Review metrics weekly
- [ ] Document baseline metrics
- [ ] Set up Slack notifications

### Phase 2: Dashboard
- [ ] Choose dashboard tool
- [ ] Set up data collection
- [ ] Create dashboard
- [ ] Share with team

### Phase 3: Alerting
- [ ] Define alert conditions
- [ ] Set up alert channels
- [ ] Test alerts
- [ ] Document alert response

### Phase 4: Reporting
- [ ] Create report templates
- [ ] Automate report generation
- [ ] Schedule distribution
- [ ] Gather feedback

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Metrics API](https://docs.github.com/en/rest/actions)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)

## Summary

Monitoring the CI/CD pipeline helps maintain code quality and developer productivity. Start with GitHub's built-in tools and expand to custom dashboards as needed.

**Key Takeaways**:
- Track build success rate, build time, and test pass rate
- Set up alerts for critical failures
- Review metrics regularly
- Continuously improve based on data

For questions or setup assistance, contact the DevOps team.
