# DeepBridge 使用手册

> 面向人工使用者的操作指南。不需要看懂内部实现，照着步骤做即可把 Java Spring 服务变成 AI 智能体可调用的工具。

---

## 目录

1. [DeepBridge 是什么](#一deepbridge-是什么)
2. [开始之前：环境与安装](#二开始之前环境与安装)
3. [5 分钟快速上手](#三5-分钟快速上手)
4. [功能详解](#四功能详解)
5. [实战场景](#五实战场景)
6. [常见问题 FAQ](#六常见问题-faq)
7. [命令速查表](#七命令速查表)

---

## 一、DeepBridge 是什么

DeepBridge 是一个「桥梁」工具，解决一个具体问题：

> **你有一个已经写好的 Java Spring 后端服务（比如订单、用户、库存），现在想做一个 AI 智能体，让用户能用大白话操作这些服务。DeepBridge 帮你自动生成中间所有需要的代码，不用手写。**

具体来说，它做三件事：

1. **读**：自动读懂你的 Spring 服务有哪些方法、参数、字段。
2. **转**：把这些方法转成 AI 能理解、能调用的「工具」（LangChain Tool）。
3. **生**：生成配套的智能体工程、契约文件、联调环境，一套齐全。

一句话总结：**给 Spring 服务「接上」AI 能力，从手写几百行胶水代码，变成一条命令搞定。**

---

## 二、开始之前：环境与安装

### 2.1 你需要准备什么

| 项目 | 要求 | 说明 |
|------|------|------|
| Node.js | ≥ 18 | 运行 DeepBridge 本身 |
| Java 项目 | Spring Boot 3.x | 你要接入 AI 的后端项目 |
| Python | 3.10 ~ 3.13 | 运行生成的智能体（可选，生成代码才需要） |

### 2.2 三种使用方式（任选其一）

DeepBridge 提供三种入口，按你的习惯选：

| 方式 | 适合谁 | 特点 |
|------|--------|------|
| **① 命令行 CLI** | 所有人 | 最直接，一条命令完成 |
| **② IDEA 插件** | IntelliJ 用户 | 图形化，右键菜单操作 |
| **③ DeepSeek Harness** | AI 助手用户 | 让 AI 智能体自动帮你调用 |

下面分别说明安装。

#### 方式①：命令行 CLI

CLI 已经在本地构建好，直接调用：

```bash
# 通用格式
node "D:\WorkBuddy\2026-08-19-14-17-43\deepbridge\packages\cli\dist\cli.js" <命令>

# 看帮助
node "D:\WorkBuddy\2026-08-19-14-17-43\deepbridge\packages\cli\dist\cli.js" --help
```

#### 方式②：IDEA 插件（已装好）

插件已安装到你的 IDEA 2025.3。**重启 IDEA 后**生效，入口有三处：

- 菜单：`Settings → Tools → DeepBridge`（看配置）
- 右键：在 Java 方法上右键 → `DeepBridge: Expose as AI Tool`
- 侧边栏：右侧工具窗口 `DeepBridge Sync`

> 首次使用需确认设置页里的「Node 路径」和「引擎路径」已填好（本机已预填，无需改动）。

#### 方式③：DeepSeek Harness

如果你在 AI 助手里使用，插件通过 5 个工具方法提供能力：

| 方法 | 作用 |
|------|------|
| `version()` | 查看版本，确认插件可用 |
| `parse(文件路径)` | 解析 Java 文件 |
| `generate(项目目录)` | 一键生成全部代码 |
| `sync(项目目录)` | 同步契约 |
| `diff(项目目录)` | 查看契约差异 |

---

## 三、5 分钟快速上手

跟着做一遍，你就懂了整个流程。

### 第 1 步：进入你的 Spring 项目目录

```bash
cd 你的Spring项目根目录
```

### 第 2 步：创建配置文件

在项目根目录新建一个 `deepbridge.yaml`，内容：

```yaml
sourceRoots:
  - src/main/java          # 你的 Java 源码在哪
outputDir: agent-service/app/tools   # 生成的工具放哪
contractPath: .deepbridge/contract.yaml  # 契约文件放哪
```

### 第 3 步：一键生成

```bash
node "D:\WorkBuddy\2026-08-19-14-17-43\deepbridge\packages\cli\dist\cli.js" generate --yes
```

### 第 4 步：看结果

命令执行完，你的项目里会多出这些文件：

```
agent-service/app/tools/order_tools.py   ← AI 工具（核心产物）
agent-service/app/agent.py               ← 智能体本体
agent-service/app/config.py              ← 模型配置
agent-service/app/server.py              ← 对外服务接口
spring-wrapper/*.java                    ← Spring 包装器
.deepbridge/contract.yaml                ← 契约（接口说明）
docker-compose.yml + otel-config.yaml    ← 联调环境
```

**到此为止，你的 Spring 服务已经「接上」了 AI 能力。** 前 3 步就完成了 80% 的工作。

---

## 四、功能详解

DeepBridge 的核心命令只有 5 个，对应 5 个功能。

### 4.1 初始化项目 — `init`

```bash
node .../cli.js init
```

作用：生成一个默认的 `deepbridge.yaml` 配置文件（如果还没有）。

### 4.2 解析 Java 文件 — `parse`

```bash
node .../cli.js parse 某个Java文件.java --json
```

作用：读取一个 Java 文件，输出它有哪些方法、参数、字段（结构化信息）。

**什么时候用**：想先看看某个服务会被识别成什么样，再决定是否生成。

### 4.3 全量生成 — `generate`

```bash
node .../cli.js generate --yes
```

作用：**最核心的命令**。读配置里的所有 Java 源码，生成全部产物（工具 + 智能体 + 包装器 + 契约 + 联调环境）。

`--yes` 表示跳过确认直接写入。去掉 `--yes` 会先预览再问你。

### 4.4 同步契约 — `sync`

```bash
node .../cli.js sync
```

作用：当你改了 Java 代码（比如字段变了）后，重新生成契约，让 Java 和 Python 两侧保持一致。

### 4.5 查看差异 — `diff`

```bash
node .../cli.js diff
```

作用：查看当前 Java 代码和已有契约之间的差异，**重点看有没有「破坏性变更」**（比如删了字段、改了类型），这些会让已生成的工具失效。

> 如果 diff 返回退出码 `2`，说明有破坏性变更，需要你确认后再同步。

---

## 五、实战场景

### 场景 1：把已有的订单服务变成 AI 工具

**背景**：你有一个 `OrderService`，里面有 `createOrder`（创建订单）、`queryOrder`（查订单）两个方法。你想让 AI 智能体能用自然语言下单、查单。

**操作**：

1. 确认 `OrderService.java` 在 `src/main/java` 下（配置里的 sourceRoots 能扫到它）。
2. 运行 `generate --yes`。
3. 打开生成的 `agent-service/app/tools/order_tools.py`，你会看到 `create_order` 和 `query_order` 两个 AI 工具函数，已经自动生成好了。

**完成**：现在你的智能体（`agent.py`）已经装配了这两个工具，能听懂「帮我创建一个订单」这种话。

### 场景 2：生成一个完整的 LangGraph 智能体

**操作**：运行 `generate --yes` 后，看生成的 `agent-service/app/` 目录：

```
agent-service/app/
├── agent.py      # 智能体逻辑（状态图，自动装配工具）
├── config.py     # 模型配置（默认 DeepSeek，可用环境变量改）
└── server.py     # FastAPI 服务，对外暴露 /agent/invoke 接口
```

**使用**：
1. 设置环境变量 `DEEPSEEK_API_KEY`（你的 API 密钥）。
2. 启动服务：`python agent-service/app/server.py`。
3. 调用 `POST /agent/invoke`，传入自然语言指令即可。

### 场景 3：改了 Java 代码后保持同步

**背景**：你给 `Order` 加了一个字段 `discount`。

**操作**：

1. 先看差异：`node .../cli.js diff` —— 会提示新增了 `discount` 字段。
2. 同步：`node .../cli.js sync` —— 重新生成契约和工具。
3. 重新生成工具代码：`node .../cli.js generate --yes`。

**注意**：如果 diff 提示「破坏性变更」（比如删字段、改类型），先确认没有其他依赖方再用 `sync`。

---

## 六、常见问题 FAQ

### Q1：生成的 Python 代码需要什么环境？

需要安装：`langchain-core`、`langgraph`、`langchain-openai`、`pydantic`(v2)、`httpx`、`fastapi`。Python 版本 3.10~3.13 均可。

### Q2：智能体用哪个模型？

默认用 DeepSeek（`deepseek-chat`），通过环境变量 `DEEPSEEK_API_KEY` 提供密钥。想换模型，改 `agent-service/app/config.py` 里的配置即可。

### Q3：同一个 Service 类有多个方法，会冲突吗？

不会。DeepBridge 会把同一个类的所有方法合并生成到**同一个** `{域名}_tools.py` 文件里，不会互相覆盖。

### Q4：`generate` 和 `sync` 有什么区别？

- `generate`：从 Java 源码**全量生成**所有产物。
- `sync`：只**更新契约文件**（.deepbridge/contract.yaml），让契约和代码一致。

通常是「先 sync 更新契约，再 generate 重新生成代码」。

### Q5：破坏性变更是什么？为什么要关心？

破坏性变更 = 会导致已生成工具失效的改动，例如：删掉一个字段、改变字段类型、把一个可选参数改成必填。这些改动会让 AI 调用工具时出错，所以 DeepBridge 会显式提醒你。

### Q6：IDEA 插件怎么用？

重启 IDEA 后：
- 在 Java 方法上右键 → `DeepBridge: Expose as AI Tool`
- 右侧 `DeepBridge Sync` 工具窗口看契约 diff
- `Settings → Tools → DeepBridge` 看配置（Node 路径、引擎路径已预填）

### Q7：联调环境（docker-compose）怎么用？

生成的 `docker-compose.yml` 包含 Spring 服务 + Python 智能体 + OpenTelemetry 追踪。运行 `docker compose up` 即可一键启动整套环境，方便本地联调。

---

## 七、命令速查表

| 命令 | 作用 | 常用参数 |
|------|------|----------|
| `init` | 生成配置文件 | 无 |
| `parse <文件>` | 解析 Java 文件 | `--json` 输出结构化结果 |
| `generate` | 全量生成代码 | `--yes` 跳过确认 |
| `sync` | 同步契约 | 无 |
| `diff` | 查看契约差异 | 无（退出码 2 = 有破坏性变更） |
| `--version` | 查看版本 | 无 |
| `--stdio` | 启动 JSON-RPC 服务（供 IDE 插件用） | 无 |

### 完整命令示例

```bash
CLI="D:\WorkBuddy\2026-08-19-14-17-43\deepbridge\packages\cli\dist\cli.js"

node "$CLI" init                          # 1. 初始化
node "$CLI" parse src/main/java/com/example/OrderService.java --json   # 2. 解析
node "$CLI" generate --yes                # 3. 生成
node "$CLI" diff                          # 4. 查看差异
node "$CLI" sync                          # 5. 同步契约
```

---

## 附：核心路径速查

| 名称 | 本机路径 |
|------|----------|
| CLI 入口 | `D:\WorkBuddy\2026-08-19-14-17-43\deepbridge\packages\cli\dist\cli.js` |
| Node 可执行文件 | `C:\Users\16380\.workbuddy\binaries\node\versions\22.22.2\node.exe` |
| IDEA 插件设置 | `Settings → Tools → DeepBridge` |
| Harness 插件服务 | `@deepseek-ai/dsh-deepbridge` |

> 更多技术细节（架构、设计思路）见仓库 README；本手册只讲「怎么用」。
