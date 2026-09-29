---
title: SimMMDG — What Should Be Shared Across Modalities?
date: 2026-09-08
type: reading
summary: A short reading note on modality-generalizable representations, shared structure and domain shift.
tags: Multimodal Learning | Generalization | Paper Notes
---
# SimMMDG

## Question

What does a representation need to capture if we expect it to transfer across both domains and modalities?

## Notes

The useful distinction for me is between **cross-modal commonality** and **sensor-dependent evidence**. A representation that only compresses common information may become stable, but it can also become weak for tasks that rely on modality-specific cues.

## Connection to my work

This is relevant to sensor fusion systems where one modality may degrade or disappear.
