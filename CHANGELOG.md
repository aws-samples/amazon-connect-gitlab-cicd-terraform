# Changelog

All notable changes to this project will be documented in this file. Considerable changes at the project level are registered in more details at [Decision Log](./docs/decision_log.md)

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format for changes and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [v1.2 03/08/2026]

Security & IAM

    Replaced Lex service-linked role with custom IAM role for fine-grained permissions
    Added Amazon Q in Connect (Wisdom) and Bedrock InvokeAgent permissions to Lex bot role
    Retained Polly, Comprehend, and CloudWatch Logs permissions scoped to specific resources

Dependency Upgrades

    Upgraded all npm packages to latest versions in contact-flows and lambda-functions
    Bumped AWS SDK from 3.734 to 3.1004, TypeScript to 5.9, Lambda Powertools to 2.31
    Cleaned up unused dependencies in lambda-functions module

Code Quality

    Migrated contact-flows ESLint from legacy .eslintrc to flat config (ESLint 10)
    Removed unused .npmrc files referencing internal package registries
    Added .DS_Store to .gitignore


## [v1.1 06/11/2025]

Core Enhancements

    Enhanced CCaaS Export tool with Lex bot and Connect views support
    Added multi-locale bot support with English and Spanish
    Improved environment-specific deployment configurations

Infrastructure Updates

    Rearchitected Lex bot deployment with better versioning and alias handling
    Enhanced Connect admin objects with views support
    Optimized contact flow templates and deployment
    Added TFLint configuration for improved code quality

DevOps Improvements

    Enhanced IAM permissions for service-linked roles
    Streamlined deployment process for infrastructure components


## [v1.0 01/28/2025]
Initial


