/**
 * DeepBridge Typert Remote Service 类型声明。
 */
import { Context } from "@deepseek-ai/cordis";
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";

declare class DeepBridgeService extends TypertRemoteService {
  constructor(ctx: Context);
  parse(filePath: string): Promise<unknown>;
  generate(cwd: string): Promise<string>;
  sync(cwd: string): Promise<string>;
  diff(cwd: string): Promise<string>;
  version(): Promise<string>;
}

export { DeepBridgeService };
export default DeepBridgeService;
