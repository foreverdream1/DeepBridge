---
name: deepbridge
description: 将 Java Spring 后端服务解析为 LangChain 工具与 LangGraph 智能体，实现传统 Java 项目的智能化落地。通过 Typert 远程工具（命名空间 deepbridge）调用本机 DeepBridge CLI 完成解析、代码生成、契约同步。
whenToUse: 当用户需要（1）把 Spring @Service/@RestController 方法暴露为 AI 工具；（2）生成 LangChain/LangGraph 智能体；（3）同步 Java DTO 与 Pydantic/OpenAPI 契约；（4）生成 Spring 包装器或联调环境时使用。
user-invocable: true
---

# DeepBridge 工具

你是 DeepBridge 的使用者。DeepBridge 能将 Java Spring 后端服务能力桥接为 LangChain 智能体可调用的工具，实现「智能体 + 传统 Java 项目」的智能化落地。

## 可用的远程工具（命名空间 `deepbridge`）

调用方式：通过 Typert 远程调用，命名空间为 `deepbridge`，方法如下：

| 方法 | 参数 | 返回 | 用途 |
|------|------|------|------|
| `version` | 无 | string | 查询 DeepBridge CLI 版本（可用来确认插件可用） |
| `parse` | `filePath`（Java 文件绝对路径） | 对象 | 解析 Java 源码为结构化 IR（services + schemas） |
| `generate` | `cwd`（Spring 项目根目录） | string | 全量生成：Python 工具 + LangGraph 智能体 + Spring 包装器 + 契约 + 联调环境 |
| `sync` | `cwd`（项目根目录） | string | 同步 OpenAPI 契约 |
| `diff` | `cwd`（项目根目录） | string | 查看契约 diff（含破坏性变更标记） |

## 使用场景与流程

### 场景 1：把 Spring 服务暴露为 AI 工具

1. 先用 `parse` 解析目标 Java 文件，确认它包含 `@Service`/`@RestController` 方法。
2. 在项目根目录创建 `deepbridge.yaml`（见下）。
3. 用 `generate` 全量生成，得到 `agent-service/app/tools/{domain}_tools.py` 等产物。

### 场景 2：生成 LangGraph 智能体

`generate` 会同时产出：
- `agent.py`（StateGraph 状态图，自动装配工具）
- `config.py`（模型配置，默认 DeepSeek）
- `server.py`（FastAPI 服务）

### 场景 3：契约同步

修改 Java DTO 后，用 `sync` 重新生成 OpenAPI 契约；用 `diff` 查看破坏性变更（字段删除、类型改变、required 新增）。

## deepbridge.yaml 配置

在 Spring 项目根目录创建：

```yaml
sourceRoots:
  - src/main/java
outputDir: agent-service/app/tools
contractPath: .deepbridge/contract.yaml
```

## 关键规则

1. `generate` 和 `sync` 需要项目根目录（含 `deepbridge.yaml`）作为 `cwd` 参数。
2. 同一 Spring Service 类的多个方法会合并生成到同一个 `{domain}_tools.py` 文件。
3. 破坏性契约变更会以退出码 2 或错误信息返回，需告知用户确认。
4. 生成的 Python 代码默认使用 DeepSeek 模型（环境变量 `DEEPSEEK_API_KEY`）。
5. 调用前可先 `version` 确认插件已就绪。
