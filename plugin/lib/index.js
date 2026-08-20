/**
 * DeepBridge Typert Remote Service：将 Spring 后端服务解析为 LangChain 工具与 LangGraph 智能体。
 *
 * 通过 Typert Remote 协议暴露给 agent 可调用的工具方法：
 *   - parse    解析 Java 源码为结构化 IR
 *   - generate 全量生成（工具 + 智能体 + 包装器 + 契约 + 联调环境）
 *   - sync     同步 OpenAPI 契约
 *   - diff     查看契约 diff
 *   - version  返回 CLI 版本
 *
 * 底层通过子进程调用本机已构建的 DeepBridge CLI（Node.js）。
 * 服务名：deepbridge（命名空间 deepbridge）。
 * @module @deepseek-ai/dsh-deepbridge
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Service } from "@deepseek-ai/cordis";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";

const execFileAsync = promisify(execFile);

/** 本机已构建的 DeepBridge CLI 入口。 */
const DEEPBRIDGE_CLI = "D:\\WorkBuddy\\2026-08-19-14-17-43\\deepbridge\\packages\\cli\\dist\\cli.js";

// —— TypeScript ES 装饰器运行时辅助（__esDecorate / __runInitializers）——
var __runInitializers = function (thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate = function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? (contextIn["static"] ? ctor : ctor.prototype) : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function (f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) if (kind === "field") initializers.unshift(_);
		else descriptor[key] = _;
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};

/**
 * 执行一次 DeepBridge CLI 调用，返回 stdout 文本。
 * @param args - 传给 CLI 的命令行参数。
 * @param cwd - 工作目录（generate/sync/diff 需要项目根）。
 * @returns stdout 文本。
 */
async function runCli(args, cwd) {
	const { stdout } = await execFileAsync("node", [DEEPBRIDGE_CLI, ...args], {
		cwd,
		maxBuffer: 64 * 1024 * 1024,
	});
	return stdout;
}

/**
 * DeepBridge 服务（Typert Remote：方法对 agent 可调用）。
 */
var DeepBridgeService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _parse_decorators;
	let _generate_decorators;
	let _sync_decorators;
	let _diff_decorators;
	let _version_decorators;
	return class DeepBridgeService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_parse_decorators = [Remote];
			_generate_decorators = [Remote];
			_sync_decorators = [Remote];
			_diff_decorators = [Remote];
			_version_decorators = [Remote];
			__esDecorate(this, null, _parse_decorators, { kind: "method", name: "parse", static: false, private: false, access: { has: (obj) => "parse" in obj, get: (obj) => obj.parse }, metadata: _metadata }, null, _instanceExtraInitializers);
			__esDecorate(this, null, _generate_decorators, { kind: "method", name: "generate", static: false, private: false, access: { has: (obj) => "generate" in obj, get: (obj) => obj.generate }, metadata: _metadata }, null, _instanceExtraInitializers);
			__esDecorate(this, null, _sync_decorators, { kind: "method", name: "sync", static: false, private: false, access: { has: (obj) => "sync" in obj, get: (obj) => obj.sync }, metadata: _metadata }, null, _instanceExtraInitializers);
			__esDecorate(this, null, _diff_decorators, { kind: "method", name: "diff", static: false, private: false, access: { has: (obj) => "diff" in obj, get: (obj) => obj.diff }, metadata: _metadata }, null, _instanceExtraInitializers);
			__esDecorate(this, null, _version_decorators, { kind: "method", name: "version", static: false, private: false, access: { has: (obj) => "version" in obj, get: (obj) => obj.version }, metadata: _metadata }, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
		}
		constructor(ctx) {
			super(ctx, "deepbridge");
			// 执行 @Remote 装饰器收集的 initializer，把方法标记到 Typert 的 marker 表
			__runInitializers(this, _instanceExtraInitializers);
		}
		/**
		 * 解析 Java 源码为结构化中间表示（IR）。
		 * @param filePath - Java 文件绝对路径。
		 * @returns 解析结果对象（services + schemas）。
		 */
		async parse(filePath) {
			const stdout = await runCli(["parse", filePath, "--json"]);
			return JSON.parse(stdout);
		}
		/**
		 * 全量生成：Python 工具 + LangGraph 智能体 + Spring 包装器 + 契约 + 联调环境。
		 * @param cwd - Spring 项目根目录（需含 deepbridge.yaml）。
		 * @returns 生成的文件清单文本。
		 */
		async generate(cwd) {
			return await runCli(["generate", "--yes"], cwd);
		}
		/**
		 * 同步 OpenAPI 契约。
		 * @param cwd - 项目根目录。
		 * @returns 同步结果文本。
		 */
		async sync(cwd) {
			return await runCli(["sync"], cwd);
		}
		/**
		 * 查看契约 diff。
		 * @param cwd - 项目根目录。
		 * @returns diff 结果文本（含破坏性变更标记）。
		 */
		async diff(cwd) {
			return await runCli(["diff"], cwd);
		}
		/**
		 * 返回 DeepBridge CLI 的版本号。
		 * @returns 版本字符串。
		 */
		async version() {
			return (await runCli(["--version"])).trim();
		}
	};
})();

export { DeepBridgeService, DeepBridgeService as default };
