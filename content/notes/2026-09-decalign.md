---
title: DecAlign — Reading Notes
date: 2026-09-12
type: reading
summary: Notes on decoupled alignment in multimodal representation learning and what it changes about shared representations.
tags: Multimodal Learning | Alignment | Representation
---
# DecAlign — Reading Notes

## Why I read this paper

I am interested in a recurring question in multimodal learning: **what should be shared across modalities, and what should remain modality-specific?**

## Problem

Heterogeneous sensors observe complementary properties of the same physical world, so forcing every feature into a fully shared space may discard useful modality-specific information.

## What I want to remember

- Alignment is a design choice, not a universal objective.
- Shared representations should be evaluated together with modality-specific information retention.
- A useful fusion mechanism should answer *where* to align, *what* to preserve, and *when* to exchange information.

## My thoughts

For RGB–LiDAR perception, image appearance and point-cloud geometry are correlated but not interchangeable. A useful representation should support cross-modal correspondence without erasing complementary structure.
