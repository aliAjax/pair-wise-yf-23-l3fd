import { listFixturesService, saveFixtureService } from "../services/FixtureService";
import { wrapServiceError } from "./errors";
import type { Fixture } from "../types/Fixture";

const endpoint = "/api/fixture";

/** 本地模拟 REST：controller 层只做入参/异常包装，逻辑在 service */
export async function listFixture(): Promise<Fixture[]> {
  try {
    return await listFixturesService();
  } catch (error) {
    throw wrapServiceError(error);
  }
}

export async function saveFixture(payload: Fixture): Promise<Fixture> {
  try {
    if (!payload.fixture_code || payload.channel_count <= 0) {
      throw new Error(`${endpoint}: fixture_code / channel_count 不合法`);
    }
    return await saveFixtureService(payload);
  } catch (error) {
    throw wrapServiceError(error);
  }
}
