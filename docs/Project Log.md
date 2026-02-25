# Project Log

## Project Overview

AI CRM is a structured, operator focused customer relationship management system designed to replace a static HTML prototype with a real application architecture.

The goal is to build a minimalist but powerful CRM that:

- Uses Companies and Contacts as master records
- Uses a single canonical Engagement record that transitions between Lead, Deal, and Account states
- Avoids duplication during conversions
- Supports Tasks and Activities as first class operational records
- Enables safe AI assisted modifications in the future
- Supports email ingestion and automated last touch tracking later
- Remains cost efficient in database and AI usage

This system is designed for a single operator workflow first, with architectural decisions made to allow future expansion.

---

## Architectural Foundation

### Core Stack

- Next.js 16 application with App Router
- PostgreSQL hosted on Neon
- Prisma ORM version 6
- Structured API routes inside Next.js
- TypeScript enabled

### Data Model Principles

- Companies and Contacts are master entities
- Engagement is the single canonical pipeline record
- Engagement transitions between:
  - LEAD
  - DEAL
  - ACCOUNT
- No duplicate records during conversions
- Tasks and Activities attach to Engagement
- Import scripts must be idempotent

---

## Day 1 Log - Feb 25, 2026

### Environment Setup

- Created GitHub repository ai-crm
- Cloned repository locally
- Initialized Next.js application
- Cleaned default starter UI
- Implemented App Shell layout with sidebar navigation
- Committed baseline project structure

### Database Setup

- Installed Prisma and configured Neon PostgreSQL
- Resolved Prisma v7 client adapter issue by downgrading to Prisma v6
- Defined core schema models:
  - Company
  - Contact
  - Engagement
  - Task
  - Activity
- Applied initial migration to Neon database
- Verified database connectivity via API route

### API Layer

- Implemented Prisma client helper
- Created GET /api/engagements route
- Verified end to end data retrieval from database

### Prototype Data Import

- Built import script to extract SEED object from crm.html
- Parsed JavaScript style object using JSON5
- Mapped prototype data to:
  - Companies
  - Contacts
  - Engagements
- Successfully imported 41 records
- Added prototypeSource and prototypeKey fields
- Enforced unique constraint on [prototypeSource, prototypeKey]
- Converted import script to use upsert for idempotent behavior
- Verified re-running import does not create duplicates

### Current State

- Database populated with real imported data
- Backend fully connected
- Schema stable
- Import pipeline hardened
- Project documentation started

