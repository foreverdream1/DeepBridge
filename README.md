# DeepBridge

将 Java Spring 后端服务自动桥接为 LangChain 智能体可调用的工具，实现「智能体 + 传统 Java 项目」的智能化落地。

DeepBridge 通过解析 Spring `@Service` / `@RestController` 源码，自动生成 LangChain `@tool`、LangGraph 智能体、Spring 包装器、OpenAPI 3.1 契约与 docker-compose 联调环境，打通传统企业级 Java 后端与 AI 智能体之间的「最后一公里」。

## 解决的核心痛点

在将 AI 智能体引入已有 Java 后端项目时，开发者通常面临：

| 痛点 | DeepBridge 的解决方式 |
|------|----------------------|
| Spring 服务能力无法被 AI 调用 | 自动扫描 Service 方法，生成 LangChain `@tool` + JSON Schema |
| Java DTO 与 Pydantic 模型手工维护、易失同步 | 以 OpenAPI 3.1 为中间契约，双向同步生成 |
| LangChain/LangGraph 工程手工搭建繁琐 | 一键生成智能体骨架，自动装配工具 |
| Java 与 Python 双栈联调困难 | 生成 docker-compose + OpenTelemetry 全链路追踪 |
| 破坏性接口变更难察觉 | 契约 diff 引擎标记 breaking changes |

## 核心能力

```
Spring @Service 源码
    │  JavaSpringParser（tree-sitter AST）
    ▼
ServiceIR + SchemaIR（中间表示）
    ├─► generateLangChainTool   → agent-service/app/tools/{domain}_tools.py
    ├─► generateLangGraphAgent  → agent.py + config.py + server.py
    ├─► generateSpringWrapper   → Controller / DTO / Client / Service
    ├─► generateContract        → .deepbridge/contract.yaml（OpenAPI 3.1）
    └─► generateDevOps          → docker-compose.yml + otel-config.yaml
```

## 架构组成

DeepBridge 采用「契约驱动 + 引擎复用 + 多宿主」架构：

| 模块 | 技术栈 | 作用 |
|------|--------|------|
| 核心引擎 | TypeScript + tree-sitter + Handlebars | Java/Python 解析、契约生成、代码生成 |
| CLI | Node.js + Commander | 命令行全量生成/同步/diff |
| IDEA 插件 | Kotlin + JSON-RPC | 图形化暴露 AI 工具、契约 diff 面板 |
| VS Code 插件 | TypeScript | 服务/工具树、CodeLens、自动同步 |
| DeepSeek Harness 插件 | Cordis + Typert | 让 AI agent 直接调用 DeepBridge 能力 |

## 使用手册

### 一、CLI 使用（核心入口）

```bash
# 通用调用方式
node deepbridge/packages/cli/dist/cli.js <command>

# 初始化项目配置（生成 deepbridge.yaml）
node .../cli.js init

# 解析单个 Java 文件为结构化 IR
node .../cli.js parse <path> --json

# 全量生成（工具 + 智能体 + 包装器 + 契约 + 联调环境）
node .../cli.js generate --yes

# 同步 OpenAPI 契约
node .../cli.js sync

# 查看契约 diff（破坏性变更退出码 2）
node .../cli.js diff
```

### 二、项目配置文件 deepbridge.yaml

在 Spring 项目根目录创建：

```yaml
sourceRoots:
  - src/main/java
outputDir: agent-service/app/tools
contractPath: .deepbridge/contract.yaml
```

### 三、完整工作流

```bash
cd /path/to/spring-project

# 1. 初始化配置
node .../cli.js init

# 2. 编辑 deepbridge.yaml 指定 sourceRoots

# 3. 全量生成
node .../cli.js generate --yes

# 产出：
#   agent-service/app/tools/order_tools.py   ← LangChain @tool
#   agent-service/app/agent.py               ← LangGraph 智能体
#   agent-service/app/config.py              ← 模型配置（默认 DeepSeek）
#   agent-service/app/server.py              ← FastAPI 服务
#   spring-wrapper/*.java                    ← Spring 包装器
#   .deepbridge/contract.yaml                ← OpenAPI 3.1 契约
#   docker-compose.yml + otel-config.yaml    ← 联调环境
```

### 四、DeepSeek Harness 插件使用

插件以 npm 包 `@deepseek-ai/dsh-deepbridge` 形式发布，通过 Typert Remote 协议向 AI agent 暴露 5 个工具方法：

| 方法 | 参数 | 返回 | 用途 |
|------|------|------|------|
| `version` | 无 | string | 查询 CLI 版本（确认插件就绪） |
| `parse` | `filePath`（Java 文件绝对路径） | 对象 | 解析 Java 为结构化 IR |
| `generate` | `cwd`（项目根目录） | string | 全量生成代码 |
| `sync` | `cwd`（项目根目录） | string | 同步 OpenAPI 契约 |
| `diff` | `cwd`（项目根目录） | string | 查看契约 diff |

**安装方式**：将插件包放入 harness 的 `profiles/node_modules/@deepseek-ai/dsh-deepbridge/`，并在 profile 的 `cordis.patch.yml` 中注册：

```yaml
- insert:
    - id: deepbridge
      name: '@deepseek-ai/dsh-deepbridge'
```

**让 agent 学会使用**：配套 skill 文件（`skills/deepbridge.md`）放在 `~/.dsh/skills/` 下，agent 通过 skill 工具加载后即可理解何时、如何使用 DeepBridge。

### 五、IDE 插件安装

IDEA 插件（可选，图形化操作）：

1. 构建产出 `deepbridge-idea-plugin-0.1.0.zip`
2. IDEA 中：Settings → Plugins → ⚙ → Install Plugin from Disk → 选择 zip
3. 安装后在 Settings → Tools → DeepBridge 配置 Node 路径与引擎脚本

## 关键设计

- **契约驱动**：以 OpenAPI 3.1 为唯一中间契约，保证 Java 与 Python 两侧始终一致
- **临时文件替换法**：增删改操作原子安全，杜绝文件损坏
- **破坏性变更检测**：字段删除、类型改变、required 新增会显式告警
- **多方法合并**：同一 Service 类的多方法合并到同一工具文件，避免覆盖

## 前置依赖

- Node.js ≥ 18
- 生成的 Python 代码依赖：`langchain-core`、`langgraph`、`langchain-openai`、`pydantic` v2、`httpx`、`fastapi`
- 环境变量：`DEEPSEEK_API_KEY`、`SPRING_API_BASE_URL`、`DEEPBRIDGE_MODEL`（默认 deepseek-chat）

## 目录结构

```
DeepBridge/
├── plugin/                          # DeepSeek Harness 插件（@deepseek-ai/dsh-deepbridge）
│   ├── package.json
│   ├── lib/
│   │   ├── index.js                 # DeepBridgeService（Typert Remote）
│   │   └── index.d.ts
│   └── skills/
│       └── deepbridge.md            # agent skill（让 agent 学会使用）
└── README.md
```

> 完整工程（核心引擎 + CLI + IDEA/VS Code 插件）规模较大，本仓库聚焦发布 DeepSeek Harness 插件及使用文档；核心引擎与 CLI 的实现细节见文档所述架构。
