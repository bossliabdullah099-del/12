export interface ProgrammingLanguage {
  id: string;
  name: string;
  category: 'Systems' | 'Web & Fullstack' | 'Backend' | 'Mobile' | 'Data & AI' | 'DevOps & Cloud' | 'Database' | 'Smart Contracts' | 'Functional' | 'Scientific';
  extension: string;
  badge: string;
  color: string;
  highlightKey: string;
  description: string;
  paradigms: string[];
  keyFrameworks: string[];
  promptStarters: { title: string; prompt: string }[];
  sampleCode: string;
}

export const PROGRAMMING_LANGUAGES: ProgrammingLanguage[] = [
  {
    id: 'python',
    name: 'Python',
    category: 'Data & AI',
    extension: '.py',
    badge: 'AI / Data Science & Backend',
    color: '#3776ab',
    highlightKey: 'python',
    description: 'High-level, dynamically typed language with rich ecosystem for AI, ML, scientific computing, automation, and backend engineering.',
    paradigms: ['Multi-paradigm', 'Object-Oriented', 'Functional', 'Imperative'],
    keyFrameworks: ['PyTorch', 'TensorFlow', 'FastAPI', 'Django', 'Pandas', 'NumPy', 'Polars'],
    promptStarters: [
      {
        title: 'FastAPI Production Microservice',
        prompt: 'Write a high-performance async FastAPI service with Pydantic v2 schemas, JWT authentication, dependency injection, and SQLite/PostgreSQL async session management.',
      },
      {
        title: 'PyTorch Neural Network Training Loop',
        prompt: 'Implement a complete PyTorch training pipeline with custom Dataset, DataLoader, Transformer/CNN architecture, mixed-precision (torch.cuda.amp), and gradient clipping.',
      },
      {
        title: 'Optimized Data Processing with Polars',
        prompt: 'Write an optimized data aggregation script using Polars LazyFrame with parallel expressions, grouping, and memory profiling.',
      },
    ],
    sampleCode: `from typing import Annotated
from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, Field

app = FastAPI(title="Boss AI Enterprise API", version="3.0")

class ItemPayload(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=100)]
    price: Annotated[float, Field(gt=0)]
    tags: list[str] = []

@app.post("/items", status_code=status.HTTP_201_CREATED)
async def create_item(payload: ItemPayload) -> dict:
    # High-efficiency asynchronous handler with strict Pydantic validation
    return {"status": "success", "data": payload.model_dump()}`,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'Web & Fullstack',
    extension: '.ts',
    badge: 'Strict Type-Safe Fullstack',
    color: '#3178c6',
    highlightKey: 'typescript',
    description: 'Strict syntactical superset of JavaScript providing static types, modern ECMAScript features, and enterprise-grade scalability.',
    paradigms: ['Object-Oriented', 'Functional', 'Event-Driven'],
    keyFrameworks: ['React', 'Next.js', 'Node.js', 'NestJS', 'Express', 'Zod', 'Prisma'],
    promptStarters: [
      {
        title: 'Enterprise Clean Architecture in TS',
        prompt: 'Architect an enterprise TypeScript service following Domain-Driven Design (DDD) with Result type error handling, repository interfaces, and dependency inversion.',
      },
      {
        title: 'Advanced Generic Type Utilities',
        prompt: 'Write advanced TypeScript utility types using conditional types, template literal types, mapped types, and infer keywords for deep immutability and schema validation.',
      },
    ],
    sampleCode: `type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

interface User {
  readonly id: string;
  readonly email: string;
  readonly role: 'admin' | 'engineer';
}

export async function fetchUserById(id: string): Promise<Result<User>> {
  try {
    // Production-grade async result pattern
    const user: User = { id, email: 'dev@bossai.internal', role: 'engineer' };
    return { ok: true, value: user };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}`,
  },
  {
    id: 'rust',
    name: 'Rust',
    category: 'Systems',
    extension: '.rs',
    badge: 'Memory-Safe Systems & WebAssembly',
    color: '#dea584',
    highlightKey: 'rust',
    description: 'Blazingly fast, memory-efficient systems language with zero-cost abstractions, fearless concurrency, and compile-time ownership guarantees without garbage collection.',
    paradigms: ['Multi-paradigm', 'Functional', 'Concurrent', 'Imperative'],
    keyFrameworks: ['Tokio', 'Axum', 'Actix-web', 'Rayon', 'Serde', 'Wasm-pack'],
    promptStarters: [
      {
        title: 'Async Axum Web API with Tokio',
        prompt: 'Build a production-grade async REST API in Rust using Axum, Tokio, SQLx with connection pooling, and structured tracing/logging.',
      },
      {
        title: 'Thread-Safe Lock-Free Ring Buffer',
        prompt: 'Implement an idiomatic, lock-free circular buffer (Ring Buffer) in Rust using atomic operations (AtomicUsize, Ordering::SeqCst/AcqRel) and generic types.',
      },
      {
        title: 'Rust WebAssembly (Wasm) Engine',
        prompt: 'Write a high-performance image processing or matrix multiplication module in Rust compiled for WebAssembly with wasm-bindgen.',
      },
    ],
    sampleCode: `use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone)]
pub struct ThreadSafeCache<K, V> {
    inner: Arc<RwLock<std::collections::HashMap<K, V>>>,
}

impl<K: Eq + std::hash::Hash + Clone, V: Clone> ThreadSafeCache<K, V> {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }

    pub async fn get(&self, key: &K) -> Option<V> {
        let guard = self.inner.read().await;
        guard.get(key).cloned()
    }

    pub async fn insert(&self, key: K, val: V) {
        let mut guard = self.inner.write().await;
        guard.insert(key, val);
    }
}`,
  },
  {
    id: 'golang',
    name: 'Go (Golang)',
    category: 'Backend',
    extension: '.go',
    badge: 'High-Concurrency Cloud & Microservices',
    color: '#00add8',
    highlightKey: 'go',
    description: 'Statically typed, compiled language engineered by Google for scalable network servers, cloud infrastructure, and massive concurrency with lightweight goroutines.',
    paradigms: ['Concurrent', 'Imperative', 'Object-Oriented (Composition)'],
    keyFrameworks: ['Gin', 'Echo', 'Fiber', 'gRPC', 'Kubernetes Core', 'Docker Engine'],
    promptStarters: [
      {
        title: 'Production Worker Pool with Channels',
        prompt: 'Write an idiomatic Go worker pool utilizing channels, sync.WaitGroup, context.Context cancellation, graceful shutdown, and error groups (golang.org/x/sync/errgroup).',
      },
      {
        title: 'gRPC Microservice with Interceptors',
        prompt: 'Implement a gRPC service in Go with protobuf definition, streaming endpoints, unary interceptors for JWT validation and rate limiting.',
      },
    ],
    sampleCode: `package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

func WorkerPool(ctx context.Context, jobs <-chan int, results chan<- int, numWorkers int) {
	var wg sync.WaitGroup
	for w := 1; w <= numWorkers; w++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case job, ok := <-jobs:
					if !ok {
						return
					}
					// Process job safely
					results <- job * job
				}
			}
		}(w)
	}
	wg.Wait()
	close(results)
}`,
  },
  {
    id: 'cpp',
    name: 'C++',
    category: 'Systems',
    extension: '.cpp',
    badge: 'Modern C++20/C++23 Performance & Games',
    color: '#f34b7d',
    highlightKey: 'cpp',
    description: 'High-performance general-purpose language with hardware-level control, RAII memory management, templates/metaprogramming, and zero-overhead abstractions.',
    paradigms: ['Multi-paradigm', 'Object-Oriented', 'Generic', 'Functional'],
    keyFrameworks: ['STL', 'Boost', 'Unreal Engine', 'CUDA', 'OpenCV', 'CMake'],
    promptStarters: [
      {
        title: 'C++20 Concepts & Coroutines',
        prompt: 'Write a modern C++20 example demonstrating custom template concepts, constraints, ranges, and an asynchronous generator coroutine.',
      },
      {
        title: 'High-Frequency Trading Order Book',
        prompt: 'Architect a low-latency, cache-friendly Level 2 Order Book in modern C++ with std::pmr (Polymorphic Memory Resources) and branchless price matching.',
      },
    ],
    sampleCode: `#include <iostream>
#include <vector>
#include <concepts>
#include <numeric>

template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template <Numeric T>
class MathPipeline {
public:
    static T compute_sum(const std::vector<T>& data) {
        return std::accumulate(data.begin(), data.end(), T{0});
    }
};

int main() {
    std::vector<double> points = {1.5, 2.5, 3.5, 4.5};
    std::cout << "Sum: " << MathPipeline<double>::compute_sum(points) << "\\n";
    return 0;
}`,
  },
  {
    id: 'c',
    name: 'C',
    category: 'Systems',
    extension: '.c',
    badge: 'Hardware & OS Kernel Programming',
    color: '#555555',
    highlightKey: 'c',
    description: 'The foundational lingua franca of computing, operating systems (Linux, Windows, BSD), embedded devices, and low-level firmware.',
    paradigms: ['Procedural', 'Imperative', 'Structured'],
    keyFrameworks: ['POSIX', 'Linux Kernel', 'FreeRTOS', 'glibc', 'libuv'],
    promptStarters: [
      {
        title: 'POSIX Socket Server with Epoll',
        prompt: 'Write a non-blocking TCP server in C using Linux epoll, edge-triggered I/O, robust memory management, and signal handling.',
      },
      {
        title: 'Memory-Safe Arena Allocator',
        prompt: 'Implement a custom contiguous arena memory allocator in C with alignment checks, block splitting, and reset functions to prevent memory fragmentation.',
      },
    ],
    sampleCode: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char *buffer;
    size_t capacity;
    size_t offset;
} Arena;

void *arena_alloc(Arena *a, size_t size) {
    // 8-byte alignment
    size_t aligned = (size + 7) & ~7;
    if (a->offset + aligned > a->capacity) return NULL;
    void *ptr = &a->buffer[a->offset];
    a->offset += aligned;
    return ptr;
}`,
  },
  {
    id: 'java',
    name: 'Java',
    category: 'Backend',
    extension: '.java',
    badge: 'Enterprise JVM & Spring Ecosystem',
    color: '#b07219',
    highlightKey: 'java',
    description: 'Battle-tested object-oriented language running on the JVM, driving Fortune 500 enterprise architectures, distributed streaming, and Android platforms.',
    paradigms: ['Object-Oriented', 'Generic', 'Concurrent', 'Functional (Streams)'],
    keyFrameworks: ['Spring Boot 3', 'Quarkus', 'Micronaut', 'Hibernate', 'Apache Kafka'],
    promptStarters: [
      {
        title: 'Spring Boot 3 Reactive API',
        prompt: 'Create a Spring Boot 3 reactive microservice using Spring WebFlux, Project Reactor, R2DBC for reactive SQL, and OpenAPI documentation.',
      },
      {
        title: 'Java 21 Virtual Threads (Project Loom)',
        prompt: 'Demonstrate Java 21 Virtual Threads and Structured Concurrency with StructuredTaskScope, comparing throughput against traditional thread pools.',
      },
    ],
    sampleCode: `import java.util.concurrent.StructuredTaskScope;
import java.time.Duration;

public class ConcurrencyService {
    public record AggregatedResult(String user, int score) {}

    public AggregatedResult fetchConcurrently(String userId) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            var userTask = scope.fork(() -> "User-" + userId);
            var scoreTask = scope.fork(() -> 98);

            scope.join().throwIfFailed();
            return new AggregatedResult(userTask.get(), scoreTask.get());
        }
    }
}`,
  },
  {
    id: 'csharp',
    name: 'C# (.NET 8/9)',
    category: 'Backend',
    extension: '.cs',
    badge: '.NET Enterprise & Cross-Platform',
    color: '#178600',
    highlightKey: 'csharp',
    description: 'Modern, high-performance, strictly typed language powering scalable cloud microservices, ASP.NET Core, desktop apps, and Unity games.',
    paradigms: ['Object-Oriented', 'Functional', 'Asynchronous', 'Generic'],
    keyFrameworks: ['ASP.NET Core', 'Entity Framework Core', 'Unity', '.NET MAUI', 'MediatR'],
    promptStarters: [
      {
        title: 'ASP.NET Core Minimal APIs & EF Core',
        prompt: 'Write high-throughput Minimal APIs in .NET 8 with Entity Framework Core, DbContext pooling, FluentValidation, and distributed caching with Redis.',
      },
      {
        title: 'CQRS & Event Sourcing with MediatR',
        prompt: 'Implement a CQRS pattern in C# with MediatR command/query handlers, pipeline behaviors for validation and logging, and domain events.',
      },
    ],
    sampleCode: `using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.MapGet("/api/health", () => Results.Ok(new {
    Status = "Healthy",
    Timestamp = DateTimeOffset.UtcNow,
    Engine = "Boss AI .NET Core"
}));

app.Run();`,
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    category: 'Web & Fullstack',
    extension: '.js',
    badge: 'Universal Web & V8 Engine',
    color: '#f1e05a',
    highlightKey: 'javascript',
    description: 'The foundation of dynamic web browsers and universal server runtimes (Node.js, Deno, Bun) with asynchronous non-blocking event loop.',
    paradigms: ['Event-Driven', 'Functional', 'Prototype-based', 'Imperative'],
    keyFrameworks: ['Node.js', 'Express', 'Vue.js', 'Next.js', 'Svelte', 'Tailwind'],
    promptStarters: [
      {
        title: 'Custom Event Loop Async Queue',
        prompt: 'Build a robust async task queue with concurrency limits, retry backoff, and event emitters using pure ES2024 JavaScript.',
      },
      {
        title: 'Web Audio API Synthesizer',
        prompt: 'Write an interactive browser sound synthesizer using the Web Audio API with oscillators, ADSR envelope generator, and audio filters.',
      },
    ],
    sampleCode: `class AsyncQueue {
  constructor(concurrency = 4) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  enqueue(asyncFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ asyncFn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) return;
    this.running++;
    const { asyncFn, resolve, reject } = this.queue.shift();
    try {
      resolve(await asyncFn());
    } catch (err) {
      reject(err);
    } finally {
      this.running--;
      this.process();
    }
  }
}`,
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    category: 'Mobile',
    extension: '.kt',
    badge: 'Modern Android & JVM Multiplatform',
    color: '#a97bff',
    highlightKey: 'kotlin',
    description: 'Modern, concise language with first-class null safety, coroutines, extension functions, and multiplatform support across Android, JVM, and iOS.',
    paradigms: ['Object-Oriented', 'Functional', 'Coroutines'],
    keyFrameworks: ['Jetpack Compose', 'Ktor', 'Spring Boot Kotlin', 'Kotlin Multiplatform (KMP)'],
    promptStarters: [
      {
        title: 'Jetpack Compose MVI State Management',
        prompt: 'Build a complete Jetpack Compose screen with MVI (Model-View-Intent) architecture, StateFlow, ViewModel, and unidirectional data flow.',
      },
      {
        title: 'Ktor Asynchronous Microservice',
        prompt: 'Create a Ktor server with routing, content negotiation (Kotlinx Serialization), JWT auth, and coroutine-backed background workers.',
      },
    ],
    sampleCode: `import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

data class UiState(val items: List<String> = emptyList(), val isLoading: Boolean = false)

class ProductViewModel {
    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state.asStateFlow()

    fun updateItems(newItems: List<String>) {
        _state.value = _state.value.copy(items = newItems, isLoading = false)
    }
}`,
  },
  {
    id: 'swift',
    name: 'Swift',
    category: 'Mobile',
    extension: '.swift',
    badge: 'Apple Ecosystem & SwiftUI',
    color: '#f05138',
    highlightKey: 'swift',
    description: 'Fast, modern, and type-safe language engineered by Apple for iOS, iPadOS, macOS, watchOS, and server-side Swift development.',
    paradigms: ['Protocol-Oriented', 'Object-Oriented', 'Functional', 'Structured Concurrency'],
    keyFrameworks: ['SwiftUI', 'Combine', 'Async/Await', 'SwiftData', 'Vapor'],
    promptStarters: [
      {
        title: 'SwiftUI Clean MVVM with Async/Await',
        prompt: 'Build a SwiftUI app using MVVM with `@Observable` (iOS 17+), async/await network actor isolation, and smooth animation transitions.',
      },
      {
        title: 'Server-Side Swift with Vapor',
        prompt: 'Create a scalable backend service in server-side Swift using Vapor 4 and Fluent ORM with async event loop routing.',
      },
    ],
    sampleCode: `import SwiftUI
import Observation

@Observable
class UserViewModel {
    var username: String = ""
    var isVerified: Bool = false
    
    @MainActor
    func authenticate() async {
        try? await Task.sleep(nanoseconds: 500_000_000)
        self.isVerified = true
    }
}

struct ProfileView: View {
    @State private var vm = UserViewModel()

    var body: some View {
        VStack(spacing: 16) {
            Text("User: \\(vm.username)")
                .font(.headline)
            Button("Verify Identity") {
                Task { await vm.authenticate() }
            }
        }
        .padding()
    }
}`,
  },
  {
    id: 'php',
    name: 'PHP 8.3+',
    category: 'Web & Fullstack',
    extension: '.php',
    badge: 'Modern Web & Laravel Ecosystem',
    color: '#4f5d95',
    highlightKey: 'php',
    description: 'Modern server-side language with JIT compilation, typed properties, attributes, union types, and powering the world-class Laravel framework.',
    paradigms: ['Object-Oriented', 'Imperative', 'Functional'],
    keyFrameworks: ['Laravel 11', 'Symfony 7', 'Livewire', 'Filament', 'WordPress Core'],
    promptStarters: [
      {
        title: 'Laravel 11 Domain-Driven Architecture',
        prompt: 'Write clean Laravel 11 code with form requests, Eloquent relationships, API resources, database transactions, and queued notification jobs.',
      },
      {
        title: 'Modern PHP 8.3 Typed Pipeline',
        prompt: 'Demonstrate modern PHP 8.3 features: readonly classes, first-class callables, match expressions, and typed enums for domain logic.',
      },
    ],
    sampleCode: `<?php

declare(strict_types=1);

namespace App\\Services;

enum UserRole: string {
    case Admin = 'admin';
    case Engineer = 'engineer';
    case Guest = 'guest';
}

readonly class UserProfile {
    public function __construct(
        public string $id,
        public string $email,
        public UserRole $role
    ) {}

    public function canDeploy(): bool {
        return match ($this->role) {
            UserRole::Admin, UserRole::Engineer => true,
            UserRole::Guest => false,
        };
    }
}`,
  },
  {
    id: 'ruby',
    name: 'Ruby',
    category: 'Web & Fullstack',
    extension: '.rb',
    badge: 'Developer Happiness & Ruby on Rails',
    color: '#701516',
    highlightKey: 'ruby',
    description: 'Dynamic, human-centric, object-oriented language emphasizing programmer happiness and elegant convention over configuration.',
    paradigms: ['Object-Oriented', 'Functional', 'Reflective'],
    keyFrameworks: ['Ruby on Rails 7/8', 'Hotwire (Turbo/Stimulus)', 'Sidekiq', 'Sinatra', 'RSpec'],
    promptStarters: [
      {
        title: 'Rails 8 Hotwire Real-Time Feature',
        prompt: 'Implement a real-time collaborative feature using Rails 8, Hotwire Turbo Streams over ActionCable, and clean service objects.',
      },
    ],
    sampleCode: `class OrderProcessor
  attr_reader :order, :errors

  def initialize(order:)
    @order = order
    @errors = []
  end

  def execute
    ActiveRecord::Base.transaction do
      order.mark_as_processing!
      charge_payment
      enqueue_fulfillment_worker
    end
    true
  rescue StandardError => e
    @errors << e.message
    false
  end
end`,
  },
  {
    id: 'sql',
    name: 'SQL (PostgreSQL/MySQL)',
    category: 'Database',
    extension: '.sql',
    badge: 'Relational Schemas & Analytical Queries',
    color: '#e38c00',
    highlightKey: 'sql',
    description: 'Declarative query language for relational databases, complex analytical queries, indexing optimization, window functions, and transactions.',
    paradigms: ['Declarative', 'Set-Based'],
    keyFrameworks: ['PostgreSQL', 'MySQL', 'SQLite', 'DuckDB', 'Snowflake', 'BigQuery'],
    promptStarters: [
      {
        title: 'Complex Window Functions & CTEs',
        prompt: 'Write an advanced analytical SQL query with Recursive Common Table Expressions (CTEs), rolling averages, window partitioning, and percentile ranks.',
      },
      {
        title: 'Index Optimization & Schema Architecture',
        prompt: 'Design an indexed PostgreSQL schema for high-write e-commerce transactions, partitioned by range with partial and composite indexes.',
      },
    ],
    sampleCode: `-- Production-grade CTE with Window Functions & Partitioning
WITH MonthlyTotals AS (
  SELECT
    user_id,
    DATE_TRUNC('month', created_at) AS order_month,
    SUM(total_amount) AS monthly_spend,
    COUNT(id) AS transaction_count
  FROM orders
  WHERE status = 'completed'
  GROUP BY user_id, DATE_TRUNC('month', created_at)
)
SELECT
  user_id,
  order_month,
  monthly_spend,
  AVG(monthly_spend) OVER (
    PARTITION BY user_id 
    ORDER BY order_month 
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS rolling_3mo_avg,
  DENSE_RANK() OVER (PARTITION BY order_month ORDER BY monthly_spend DESC) AS spend_rank
FROM MonthlyTotals
ORDER BY order_month DESC, spend_rank ASC;`,
  },
  {
    id: 'bash',
    name: 'Bash & Shell',
    category: 'DevOps & Cloud',
    extension: '.sh',
    badge: 'Linux Automation & DevOps Scripting',
    color: '#89e051',
    highlightKey: 'bash',
    description: 'The standard Unix command-line shell and scripting language for automation, CI/CD pipelines, container orchestration, and server administration.',
    paradigms: ['Scripting', 'Command-Driven', 'Procedural'],
    keyFrameworks: ['POSIX sh', 'GNU Bash', 'Zsh', 'GitHub Actions', 'Docker CLI'],
    promptStarters: [
      {
        title: 'Robust DevOps Automation Script',
        prompt: 'Write a bulletproof Bash script with `set -euo pipefail`, structured trap signals on ERR/EXIT, colored logging functions, and CLI argument parsing.',
      },
    ],
    sampleCode: `#!/usr/bin/env bash
set -euo pipefail

# Production Shell Script Template
readonly SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="/tmp/boss_deploy.log"

log() {
  local level="$1"; shift
  printf "[%s] [%s] %s\\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$level" "$*" | tee -a "$LOG_FILE"
}

cleanup() {
  log "INFO" "Cleaning up temporary resources..."
}
trap cleanup EXIT

log "INFO" "Initializing deployment pipeline..."`,
  },
  {
    id: 'solidity',
    name: 'Solidity',
    category: 'Smart Contracts',
    extension: '.sol',
    badge: 'Ethereum & EVM Smart Contracts',
    color: '#aa6746',
    highlightKey: 'solidity',
    description: 'Statically typed contract-oriented language for developing smart contracts on the Ethereum Virtual Machine (EVM) and Layer 2 rollups.',
    paradigms: ['Contract-Oriented', 'Object-Oriented'],
    keyFrameworks: ['Foundry', 'Hardhat', 'OpenZeppelin', 'Ethers.js', 'Viem'],
    promptStarters: [
      {
        title: 'ERC-20 Token with Reentrancy Guard',
        prompt: 'Write a secure ERC-20 staking contract in Solidity 0.8.24 with OpenZeppelin ReentrancyGuard, SafeERC20, and gas-efficient reward calculation.',
      },
    ],
    sampleCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Vault is ReentrancyGuard {
    IERC20 public immutable token;
    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(address _token) {
        token = IERC20(_token);
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        balances[msg.sender] += amount;
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit Deposited(msg.sender, amount);
    }
}`,
  },
  {
    id: 'dart',
    name: 'Dart',
    category: 'Mobile',
    extension: '.dart',
    badge: 'Cross-Platform Flutter Apps',
    color: '#00b4ab',
    highlightKey: 'dart',
    description: 'Client-optimized language for fast apps on any platform, powering the Flutter mobile, desktop, and web framework with hot reload.',
    paradigms: ['Object-Oriented', 'Functional', 'Class-based'],
    keyFrameworks: ['Flutter', 'Riverpod', 'Bloc', 'Dio', 'Drift'],
    promptStarters: [
      {
        title: 'Flutter Riverpod State Management',
        prompt: 'Write clean Flutter code using Riverpod StateNotifierProvider or AsyncNotifier with error handling and reactive UI rendering.',
      },
    ],
    sampleCode: `import 'package:flutter/material.dart';

class MetricsWidget extends StatelessWidget {
  final String title;
  final double value;

  const MetricsWidget({super.key, required this.title, required this.value});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(value.toStringAsFixed(2), style: Theme.of(context).textTheme.headlineSmall),
          ],
        ),
      ),
    );
  }
}`,
  },
  {
    id: 'haskell',
    name: 'Haskell',
    category: 'Functional',
    extension: '.hs',
    badge: 'Pure Functional & Monadic Type Theory',
    color: '#5e5086',
    highlightKey: 'haskell',
    description: 'Purely functional, statically typed language with non-strict evaluation (laziness), strong type inference, and formal category theory abstractions.',
    paradigms: ['Pure Functional', 'Non-Strict / Lazy'],
    keyFrameworks: ['GHC', 'Yesod', 'Servant', 'Lens', 'QuickCheck'],
    promptStarters: [
      {
        title: 'Monad Transformers & Servant API',
        prompt: 'Write an idiomatic Haskell web API using Servant and ReaderT design pattern for dependency injection and state management.',
      },
    ],
    sampleCode: `module Main where

-- Idiomatic pure functional pipeline in Haskell
quicksort :: (Ord a) => [a] -> [a]
quicksort [] = []
quicksort (x:xs) =
    let smallerSorted = quicksort [a | a <- xs, a <= x]
        biggerSorted  = quicksort [a | a <- xs, a > x]
    in smallerSorted ++ [x] ++ biggerSorted

main :: IO ()
main = print (quicksort [10, 2, 5, 3, 1, 6, 7, 4])`,
  },
  {
    id: 'elixir',
    name: 'Elixir',
    category: 'Backend',
    extension: '.ex',
    badge: 'BEAM Erlang Fault-Tolerant Actors',
    color: '#6e4a7e',
    highlightKey: 'elixir',
    description: 'Dynamic, functional language running on the Erlang BEAM VM, engineered for building distributed, fault-tolerant, high-throughput systems.',
    paradigms: ['Functional', 'Actor Model', 'Concurrent'],
    keyFrameworks: ['Phoenix Framework', 'Phoenix LiveView', 'Ecto', 'OTP', 'Oban'],
    promptStarters: [
      {
        title: 'Phoenix LiveView Realtime Dashboard',
        prompt: 'Build an interactive Phoenix LiveView component with live pubsub updates, OTP GenServer supervision tree, and database streaming.',
      },
    ],
    sampleCode: `defmodule BossAI.Worker do
  use GenServer

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    {:ok, %{status: :ready, counter: 0}}
  end

  @impl true
  def handle_call(:increment, _from, state) do
    new_state = %{state | counter: state.counter + 1}
    {:reply, new_state.counter, new_state}
  end
end`,
  },
  {
    id: 'zig',
    name: 'Zig',
    category: 'Systems',
    extension: '.zig',
    badge: 'Next-Gen C Replacement & Compilers',
    color: '#ec915c',
    highlightKey: 'zig',
    description: 'Modern general-purpose systems programming language designed for maintainability, manual memory control, comptime metaprogramming, and zero hidden control flow.',
    paradigms: ['Imperative', 'Compile-Time Metaprogramming'],
    keyFrameworks: ['Zig Standard Library', 'Mach Engine', 'Zap Web Framework'],
    promptStarters: [
      {
        title: 'Memory Allocators & Comptime Metaprogramming',
        prompt: 'Demonstrate custom allocator usage with std.testing and comptime type reflection in modern Zig 0.13+.',
      },
    ],
    sampleCode: `const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var list = std.ArrayList(u32).init(allocator);
    defer list.deinit();

    try list.append(42);
    try list.append(100);

    std.debug.print("Items: {d}, {d}\\n", .{ list.items[0], list.items[1] });
}`,
  },
  {
    id: 'r',
    name: 'R',
    category: 'Data & AI',
    extension: '.r',
    badge: 'Statistical Computing & Visualization',
    color: '#198ce7',
    highlightKey: 'r',
    description: 'Language and environment for statistical computing, bioinformatics, econometric modeling, and high-quality scientific visualizations.',
    paradigms: ['Functional', 'Statistical', 'Vectorized'],
    keyFrameworks: ['tidyverse', 'ggplot2', 'dplyr', 'Shiny', 'data.table'],
    promptStarters: [
      {
        title: 'Tidyverse & ggplot2 Statistical Plot',
        prompt: 'Write clean R code using dplyr and ggplot2 with faceting, confidence intervals, and customized scientific publication themes.',
      },
    ],
    sampleCode: `library(dplyr)
library(ggplot2)

# High-efficiency vectorized statistical analysis
data_summary <- iris %>%
  group_by(Species) %>%
  summarize(
    mean_length = mean(Sepal.Length),
    sd_length = sd(Sepal.Length),
    count = n()
  )`,
  },
  {
    id: 'julia',
    name: 'Julia',
    category: 'Scientific',
    extension: '.jl',
    badge: 'High-Performance Numerical & Scientific',
    color: '#a270ba',
    highlightKey: 'julia',
    description: 'High-level, high-performance dynamic language designed for numerical analysis, differential equations, and scientific computing with C-like speed.',
    paradigms: ['Multiple Dispatch', 'Metaprogramming', 'Mathematical'],
    keyFrameworks: ['DifferentialEquations.jl', 'Flux.jl', 'Plots.jl', 'Turing.jl'],
    promptStarters: [
      {
        title: 'Numerical Simulation with Multiple Dispatch',
        prompt: 'Implement a vectorized simulation in Julia using multiple dispatch, custom structs, and benchmark profiling with `@btime`.',
      },
    ],
    sampleCode: `struct Particle{T<:Real}
    position::Vector{T}
    velocity::Vector{T}
end

function kinetic_energy(p::Particle{T}, mass::T) where T<:Real
    0.5 * mass * sum(p.velocity .^ 2)
end`,
  },
  {
    id: 'scala',
    name: 'Scala (Scala 3)',
    category: 'Functional',
    extension: '.scala',
    badge: 'Functional Object-Oriented JVM',
    color: '#c22d40',
    highlightKey: 'scala',
    description: 'Combines object-oriented and functional programming in one concise, high-level language with powerful type classes, givens, and Akka/Pekko actors.',
    paradigms: ['Functional', 'Object-Oriented', 'Concurrent'],
    keyFrameworks: ['Cats', 'ZIO', 'Apache Spark', 'Akka / Pekko', 'Play Framework'],
    promptStarters: [
      {
        title: 'ZIO 2 Asynchronous Functional Pipeline',
        prompt: 'Write an asynchronous, resilient data pipeline in Scala 3 using ZIO 2 with scoped resources, concurrency fibers, and typed error handling.',
      },
    ],
    sampleCode: `package bossai

enum Status:
  case Pending, Active, Completed

case class Task(id: String, status: Status)

object TaskManager:
  def filterActive(tasks: List[Task]): List[Task] =
    tasks.filter(_.status == Status.Active)`,
  },
  {
    id: 'lua',
    name: 'Lua',
    category: 'Systems',
    extension: '.lua',
    badge: 'Embedded Scripting & Game Engines',
    color: '#000080',
    highlightKey: 'lua',
    description: 'Lightweight, ultra-fast embedded scripting language with minimal memory footprint, used in game engines (Roblox, World of Warcraft), Neovim, and Nginx (OpenResty).',
    paradigms: ['Procedural', 'Prototype-based', 'Extensible'],
    keyFrameworks: ['LuaJIT', 'OpenResty', 'LÖVE 2D', 'Neovim API'],
    promptStarters: [
      {
        title: 'Neovim Plugin with Lua API',
        prompt: 'Write a modern Neovim Lua plugin with custom keymaps, user commands, and floating preview buffer window.',
      },
    ],
    sampleCode: `local M = {}

function M.create_table_pool()
  local pool = {}
  return {
    acquire = function()
      return table.remove(pool) or {}
    end,
    release = function(tbl)
      for k in pairs(tbl) do tbl[k] = nil end
      table.insert(pool, tbl)
    end
  }
end

return M`,
  },
  {
    id: 'htmlcss',
    name: 'HTML5 & CSS3',
    category: 'Web & Fullstack',
    extension: '.html',
    badge: 'Modern Web Markup & Responsive Styling',
    color: '#e34f26',
    highlightKey: 'html',
    description: 'Universal standard for web structure, semantic markup, responsive design with CSS Flexbox, Grid, animations, and modern UI architectures.',
    paradigms: ['Declarative', 'Markup', 'Cascading Stylesheets'],
    keyFrameworks: ['Tailwind CSS', 'Sass/SCSS', 'PostCSS', 'Bootstrap', 'CSS Modules'],
    promptStarters: [
      {
        title: 'Modern Responsive Hero Section',
        prompt: 'Build a modern, semantic HTML5 hero section with responsive CSS Grid/Flexbox, gradient background, glassmorphism cards, and interactive hover animations.',
      },
      {
        title: 'Accessible Semantic Form with Validation',
        prompt: 'Write an accessible WCAG-compliant HTML5 registration form with CSS floating labels, custom checkboxes, and responsive styling without external libraries.',
      },
    ],
    sampleCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boss Aura Responsive Hero</title>
  <style>
    :root { --primary: #3b82f6; --bg: #0f172a; --text: #f8fafc; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: grid; place-items: center; padding: 2rem; }
    .hero { max-width: 640px; text-align: center; }
    .hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); background: linear-gradient(135deg, #60a5fa, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero p { margin: 1rem 0 2rem; color: #94a3b8; font-size: 1.125rem; line-height: 1.6; }
    .btn { display: inline-block; padding: 0.875rem 2rem; background: var(--primary); color: #fff; text-decoration: none; border-radius: 9999px; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5); }
  </style>
</head>
<body>
  <main class="hero">
    <h1>Universal Coding Power</h1>
    <p>Boss Aura AI writes, refactors, and explains code across every programming language with precision.</p>
    <a href="#start" class="btn">Explore All Languages</a>
  </main>
</body>
</html>`,
  },
  {
    id: 'powershell',
    name: 'PowerShell',
    category: 'DevOps & Cloud',
    extension: '.ps1',
    badge: 'Windows & Cross-Platform Automation',
    color: '#012456',
    highlightKey: 'powershell',
    description: 'Object-oriented automation engine and scripting language for system administration, cloud orchestration, CI/CD pipelines, and infrastructure management.',
    paradigms: ['Object-Oriented', 'Imperative', 'Pipeline-based'],
    keyFrameworks: ['PowerShell Core (pwsh)', 'Azure Az Module', 'AWS Tools', 'Pester'],
    promptStarters: [
      {
        title: 'Automated Cloud Health Check Script',
        prompt: 'Write an idempotent PowerShell script to probe endpoints, log structured JSON metrics, and trigger alerts on failures.',
      },
    ],
    sampleCode: `[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string[]]$Endpoints,
    [int]$TimeoutSeconds = 5
)

$results = foreach ($url in $Endpoints) {
    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $resp = Invoke-WebRequest -Uri $url -TimeoutSec $TimeoutSeconds -UseBasicParsing
        $sw.Stop()
        [PSCustomObject]@{
            Url        = $url
            StatusCode = $resp.StatusCode
            LatencyMs  = $sw.ElapsedMilliseconds
            Status     = 'Healthy'
        }
    } catch {
        [PSCustomObject]@{
            Url        = $url
            StatusCode = 0
            LatencyMs  = -1
            Status     = 'Unhealthy'
        }
    }
}

$results | ConvertTo-Json -Depth 3`,
  },
  {
    id: 'assembly',
    name: 'Assembly (x86-64 / ARM)',
    category: 'Systems',
    extension: '.s',
    badge: 'Low-Level Hardware & Instruction Architecture',
    color: '#6e4c13',
    highlightKey: 'x86asm',
    description: 'Direct human-readable machine instructions for CPUs, hardware drivers, embedded systems, OS kernels, and performance-critical routines.',
    paradigms: ['Low-level', 'Machine Architecture', 'Registers'],
    keyFrameworks: ['NASM', 'GAS (GNU Assembler)', 'ARM64 ABI', 'FASM'],
    promptStarters: [
      {
        title: 'x86-64 Fast Memory Copy Routine',
        prompt: 'Write an optimized x86-64 assembly memory block copy using SIMD AVX registers with 64-byte alignment.',
      },
    ],
    sampleCode: `; x86-64 Linux Syscall Example: String Print
global _start

section .text
_start:
    ; write(1, msg, len)
    mov rax, 1          ; sys_write
    mov rdi, 1          ; stdout file descriptor
    mov rsi, msg        ; pointer to string
    mov rdx, len        ; length of string
    syscall

    ; exit(0)
    mov rax, 60         ; sys_exit
    xor rdi, rdi        ; return code 0
    syscall

section .data
    msg db "Hello from Boss Aura AI Assembly Engine!", 10
    len equ $ - msg`,
  },
  {
    id: 'matlab',
    name: 'MATLAB',
    category: 'Scientific',
    extension: '.m',
    badge: 'Numerical Computing & Signal Processing',
    color: '#e16737',
    highlightKey: 'matlab',
    description: 'High-performance matrix manipulation, algorithm development, signal processing, control systems, and data visualization platform.',
    paradigms: ['Array-oriented', 'Matrix', 'Numerical'],
    keyFrameworks: ['Simulink', 'Optimization Toolbox', 'Signal Processing Toolbox'],
    promptStarters: [
      {
        title: 'Fast Fourier Transform (FFT) Analysis',
        prompt: 'Write a MATLAB script to generate a noisy multi-frequency signal, compute its FFT spectrum, and plot filtered output.',
      },
    ],
    sampleCode: `function [f, P1] = analyze_frequencies(Fs, t_duration)
    % Sampling frequency and time vector
    t = 0:1/Fs:t_duration-1/Fs;
    L = length(t);
    
    % Synthetic signal: 50 Hz + 120 Hz + noise
    S = 0.7*sin(2*pi*50*t) + sin(2*pi*120*t);
    X = S + 2*randn(size(t));
    
    % Compute Fast Fourier Transform
    Y = fft(X);
    P2 = abs(Y/L);
    P1 = P2(1:floor(L/2)+1);
    P1(2:end-1) = 2*P1(2:end-1);
    f = Fs*(0:(L/2))/L;
end`,
  },
  {
    id: 'perl',
    name: 'Perl',
    category: 'DevOps & Cloud',
    extension: '.pl',
    badge: 'Text Processing & System Administration',
    color: '#0073a1',
    highlightKey: 'perl',
    description: 'Powerful, flexible text manipulation, regular expression processing, system scripting, and legacy automation powerhouse.',
    paradigms: ['Procedural', 'Functional', 'Regex-oriented'],
    keyFrameworks: ['Mojolicious', 'Dancer2', 'DBI', 'CPAN'],
    promptStarters: [
      {
        title: 'Log File Analyzer and Metrics Aggregator',
        prompt: 'Write a fast Perl script to parse Nginx access logs with regular expressions, count HTTP status codes, and output top IP addresses.',
      },
    ],
    sampleCode: `#!/usr/bin/env perl
use strict;
use warnings;

my %status_counts;
my %ip_counts;

while (my $line = <>) {
    chomp $line;
    # Common log format regex
    if ($line =~ /^(\\S+) \\S+ \\S+ \\[.*?\\] ".*?" (\\d{3})/) {
        my ($ip, $status) = ($1, $2);
        $status_counts{$status}++;
        $ip_counts{$ip}++;
    }
}

print "HTTP Status Summary:\\n";
for my $code (sort keys %status_counts) {
    printf "  %s: %d requests\\n", $code, $status_counts{$code};
}`,
  },
  {
    id: 'fortran',
    name: 'Fortran',
    category: 'Scientific',
    extension: '.f90',
    badge: 'High-Performance Supercomputing & Physics',
    color: '#734f96',
    highlightKey: 'fortran',
    description: 'Formula Translation language powering world supercomputers, weather modeling, quantum physics, aerospace simulations, and computational chemistry.',
    paradigms: ['Array-oriented', 'Procedural', 'Scientific High-Performance'],
    keyFrameworks: ['OpenMP', 'MPI', 'LAPACK', 'BLAS'],
    promptStarters: [
      {
        title: 'Parallel Matrix Multiplication with OpenMP',
        prompt: 'Write a modern Fortran 2018 program for parallel matrix multiplication using OpenMP directives and contiguous memory layouts.',
      },
    ],
    sampleCode: `program matrix_multiply
    implicit none
    integer, parameter :: N = 1000
    real(8), dimension(N, N) :: A, B, C
    integer :: i, j, k

    ! Initialize matrices with sample values
    call random_number(A)
    call random_number(B)
    C = 0.0d0

    ! Matrix product using modern Fortran intrinsic
    C = matmul(A, B)

    print *, "Matrix multiplication computed successfully. C(1,1) = ", C(1,1)
end program matrix_multiply`,
  },
];

