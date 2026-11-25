import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getRoom = query({
  args: {
    roomId: v.string(),
  },

  handler: async (ctx, args) => {
    return await ctx.db
      .query("rooms")
      .withIndex("by_roomId", (q) =>
        q.eq("roomId", args.roomId)
      )
      .unique();
  },
});
export const createRoom = mutation({
  args: {
    roomId: v.string(),
    pin: v.string(),
    hostId: v.string(),
  },

  handler: async (ctx, args) => {
    const existingRoom = await ctx.db
      .query("rooms")
      .withIndex("by_roomId", (q) =>
        q.eq("roomId", args.roomId)
      )
      .unique();

    if (existingRoom) {
      throw new Error("이미 사용 중인 방입니다.");
    }
    const now = Date.now();

    return await ctx.db.insert("rooms", {
      roomId: args.roomId,
      pin: args.pin,
      hostId: args.hostId,
      phase: "setup",
      round: 0,

      players: [],
      pairs: [],
      bye: null,
      choices: {},
      results: {},

      burning: false,
      multiplier: 1,
      deadline: 0,
      version: 1,
      actionId: `create-${now}`,
      updatedAt: now,
      updatedBy: args.hostId,
      createdAt: now,
    });
  },
});

export const joinRoom = mutation({
  args: {
    roomId: v.string(),
    player: v.any(),
  },

  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
    withIndex("by_roomId", (q) =>
        q.eq("roomId", args.roomId)
      )
      .unique();

    if (!room) {
      throw new Error("방을 찾을 수 없습니다.");
    }

    if (room.phase !== "setup") {
      throw new Error("이미 시작된 게임입니다.");
    }

    const players = Array.isArray(room.players)
      ? [...room.players]
      : [];

    const alreadyJoined = players.some(
      item: any) => item.id === args.player.id
    );

    if (!alreadyJoined) {
      players.push(args.player);
    }

    const now = Date.now();

    await ctx.db.patch(room._id, {
      players,
      version: room.version + 1,
      actionId: `join-${args.player.id}-${now}`,
      updatedAt: now,
      updatedBy: args.player.id,
    });

    return {
      success: true,
      playerCount: players.length,
    };
  },
});

export const startRound = mutation({
  args: {
    roomId: v.string(),
    hostId: v.string(),
    roundData: v.any(),
  },

  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomId", (q) =>
        q.eq("roomId", args.roomId)
      )
      .unique();
    if (!room) {
      throw new Error("방을 찾을 수 없습니다.");
    }

    if (room.hostId !== args.hostId) {
      throw new Error("발표자만 게임을 시작할 수 있습니다.");
    }

    const players = Array.isArray(room.players)
      ? room.players
      : [];

    if (players.length < 1) {
      throw new Error("참가자를 한 명 이상 추가해 주세요.");
      if (room.phase !== "setup" && room.phase !== "results") {
      throw new Error("현재 상태에서는 게임을 시작할 수 없습니다.");
    }

    const now = Date.now();
    const nextRound = room.round + 1;

    await ctx.db.patch(room._id, {
      phase: "playing",
      round: nextRound,

      pairs: args.roundData.pairs || [],
      bye: args.roundData.bye || null,
      choices: {},
      results: {},
burning: Boolean(args.roundData.burning),
      multiplier: Number(args.roundData.multiplier || 1),
      deadline: Number(args.roundData.deadline || now + 60000),

      version: room.version + 1,
      actionId: `start-${nextRound}-${now}`,
      updatedAt: now,
      updatedBy: args.hostId,
    });

    return {
      success: true,
      round: nextRound,
    };
  },
});
