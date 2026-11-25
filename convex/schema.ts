import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    roomId: v.string(),
    pin: v.string(),
    hostId: v.string(),
    phase: v.string(),
    round: v.number(),

    players: v.any(),
    pairs: v.any(),
    bye: v.any(),
    choices: v.any(),
    results: v.any(),
    burning: v.any(),
    multiplier: v.number(),
    deadline: v.number(),

    version: v.number(),
    actionId: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
    createdAt: v.number(),
  }).index("by_roomId", ["roomId"]),
});
