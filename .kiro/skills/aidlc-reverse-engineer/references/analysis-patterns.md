# Analysis Patterns by Language

Load the relevant section based on detected primary language.

## TypeScript / JavaScript (Node.js)

**Config files**: `package.json`, `tsconfig.json`, `.eslintrc.*`, `jest.config.*`, `vitest.config.*`
**Entry points**: `src/index.ts`, `src/main.ts`, `src/app.ts`, `src/server.ts`, `bin/`
**Frameworks**: Express (`app.get/post/use`), NestJS (`@Controller`, `@Module`, `@Injectable`), Fastify (`fastify.route`), Next.js (`pages/`, `app/`), Hono (`app.get`), Koa (`router.get`), Remix (`loader`/`action`), Nuxt.js (`server/api/`), SvelteKit (`+server.ts`, `+page.server.ts`), Astro (`src/pages/`)
**ORM/DB**: Prisma (`schema.prisma`), TypeORM (`@Entity`, `@Column`), Drizzle (`pgTable`), Mongoose (`Schema`, `model`), Knex (`knex.migrate`), Sequelize (`define`, `Model.init`), MikroORM (`@Entity`)
**Route detection**: Express `router.get/post`, NestJS `@Get/@Post`, Fastify `fastify.get`, file-based routing (`pages/`, `app/`, `server/api/`)
**Business logic signals**: Service classes, `validate*` functions, `calculate*` functions, enum-based state machines, Zod/Joi schemas
**Test patterns**: Jest/Vitest `describe/it/expect`, `__tests__/`, `*.test.ts`, `*.spec.ts`

## Python

**Config files**: `pyproject.toml`, `setup.py`, `requirements.txt`, `Pipfile`, `poetry.lock`
**Entry points**: `main.py`, `app.py`, `manage.py`, `wsgi.py`, `asgi.py`, `__main__.py`
**Frameworks**: Django (`urls.py`, `views.py`, `models.py`), FastAPI (`@app.get`, `@router`), Flask (`@app.route`), Starlette, Litestar, Tornado (`RequestHandler`), aiohttp
**ORM/DB**: Django ORM (`models.Model`), SQLAlchemy (`Base`, `Column`), Alembic (`versions/`), Tortoise ORM, Peewee, SQLModel, Beanie (MongoDB), Motor (async MongoDB)
**Route detection**: Django `urlpatterns`, FastAPI/Flask/Litestar decorators, file-based routing
**Business logic signals**: Service modules, `validators.py`, `rules.py`, dataclasses with methods, Pydantic models with validators
**Test patterns**: pytest `test_*.py`, `conftest.py`, Django `TestCase`

## Java / Kotlin

**Config files**: `pom.xml`, `build.gradle`, `application.yml`, `application.properties`
**Entry points**: `*Application.java`, `public static void main`, `@SpringBootApplication`
**Frameworks**: Spring Boot (`@RestController`, `@Service`, `@Repository`), Quarkus (`@Path`, `@Inject`), Micronaut (`@Controller`, `@Singleton`), Ktor (`routing { get/post }`), Vert.x, Jakarta EE / Java EE (`@WebServlet`, `@EJB`)
**ORM/DB**: JPA/Hibernate (`@Entity`, `@Table`, `@Column`), MyBatis (`@Mapper`, XML mappers), jOOQ, Exposed (Kotlin), Flyway/Liquibase migrations, Spring Data (`JpaRepository`, `CrudRepository`)
**Route detection**: `@GetMapping`, `@PostMapping`, `@RequestMapping`, `@Path` (JAX-RS), Ktor `routing` DSL
**Business logic signals**: Service classes, `*Validator`, `*Calculator`, enum state machines, Bean Validation annotations
**Test patterns**: JUnit `@Test`, Mockito `@Mock`, `src/test/`, `*Test.java`, `*Spec.java`

## Go

**Config files**: `go.mod`, `go.sum`, `Makefile`, `Dockerfile`
**Entry points**: `cmd/*/main.go`, `main.go`
**Frameworks**: Standard library `net/http`, Gin (`gin.Engine`), Echo (`echo.New`), Fiber (`fiber.New`), Chi (`chi.NewRouter`), gorilla/mux, Connect (gRPC-compatible)
**ORM/DB**: GORM (`gorm.Model`), sqlx, pgx, ent (`ent.Schema`), Bun, `migrations/`, goose/migrate
**Route detection**: `http.HandleFunc`, `r.GET/POST`, handler function signatures, `chi.Route`
**Business logic signals**: Domain packages, `validate` functions, `calculate` functions, `type State int` with const iota
**Test patterns**: `*_test.go`, `testing.T`, table-driven tests, `testify`

## Rust

**Config files**: `Cargo.toml`, `Cargo.lock`, `rust-toolchain.toml`, `.cargo/config.toml`
**Entry points**: `src/main.rs`, `src/lib.rs`, `src/bin/*.rs`
**Frameworks**: Actix Web (`#[get]`, `#[post]`, `HttpServer`), Axum (`Router::new().route`), Rocket (`#[get]`, `#[post]`), Warp (`warp::path`), Poem, Tide
**ORM/DB**: Diesel (`table!`, `#[derive(Queryable)]`), SeaORM (`#[derive(DeriveEntityModel)]`), SQLx (`sqlx::query!`), SurrealDB client
**Route detection**: Actix/Rocket attribute macros, Axum `Router` builder, Warp filter chains
**Business logic signals**: `impl` blocks with domain methods, `validate` functions returning `Result`, enum-based state machines with `match`, trait implementations for domain behavior
**Test patterns**: `#[cfg(test)] mod tests`, `#[test]`, `assert!`/`assert_eq!`, `tests/` integration directory, `proptest`/`quickcheck` for PBT

## C# / .NET

**Config files**: `*.csproj`, `*.sln`, `appsettings.json`, `appsettings.*.json`, `Program.cs`, `Startup.cs`, `Directory.Build.props`
**Entry points**: `Program.cs` (`Main` or top-level statements), `Startup.cs` (`Configure`, `ConfigureServices`)
**Frameworks**: ASP.NET Core (`[ApiController]`, `[HttpGet]`, `[HttpPost]`), Minimal APIs (`app.MapGet`), Blazor (`@page`), gRPC (`proto` + `ServiceBase`), MassTransit (message bus), Orleans (actors)
**ORM/DB**: Entity Framework Core (`DbContext`, `DbSet<T>`, `[Key]`, `[Required]`), Dapper, NHibernate, EF migrations (`Migrations/`)
**Route detection**: `[Route]`, `[HttpGet]`, `[HttpPost]` attributes, Minimal API `Map*` methods, `[ApiController]`
**Business logic signals**: Service classes with `I*Service` interfaces, FluentValidation (`AbstractValidator<T>`), MediatR handlers (`IRequestHandler`), domain events, `enum` state machines, specification pattern
**Test patterns**: xUnit (`[Fact]`, `[Theory]`), NUnit (`[Test]`, `[TestCase]`), MSTest, Moq (`Mock<T>`), `*.Tests` projects

## Ruby

**Config files**: `Gemfile`, `Gemfile.lock`, `Rakefile`, `.ruby-version`, `config/`
**Entry points**: `config.ru`, `bin/rails`, `app.rb`, `config/application.rb`
**Frameworks**: Rails (`routes.rb`, `app/controllers/`, `app/models/`), Sinatra (`get '/'`, `post '/'`), Hanami, Grape (API), Roda
**ORM/DB**: ActiveRecord (`has_many`, `belongs_to`, `validates`), Sequel, ROM (Ruby Object Mapper), `db/migrate/`
**Route detection**: Rails `routes.rb` (`resources`, `get`, `post`), Sinatra/Grape DSL, Hanami routes
**Business logic signals**: Service objects (`app/services/`), validators, concerns, callbacks (`before_save`, `after_create`), state machines (AASM, Statesman), policy objects (Pundit)
**Test patterns**: RSpec (`describe/it/expect`), Minitest, `spec/`, `test/`, FactoryBot, fixtures

## PHP

**Config files**: `composer.json`, `composer.lock`, `.env`, `phpunit.xml`, `webpack.mix.js`/`vite.config.js`
**Entry points**: `public/index.php`, `artisan`, `bin/console`, `index.php`
**Frameworks**: Laravel (`routes/web.php`, `routes/api.php`, `app/Http/Controllers/`), Symfony (`config/routes.yaml`, `src/Controller/`), Slim, Lumen, CodeIgniter
**ORM/DB**: Eloquent (`Model`, `hasMany`, `belongsTo`, `$fillable`), Doctrine (`@ORM\Entity`, `@ORM\Column`), `database/migrations/`
**Route detection**: Laravel `Route::get/post`, Symfony `#[Route]` attributes, `routes/*.php`
**Business logic signals**: Service classes, Form Requests (Laravel validation), Events/Listeners, Jobs, Policies (authorization), Eloquent observers, enum-backed classes (PHP 8.1+)
**Test patterns**: PHPUnit (`@test`, `testMethod`), Pest (`it('...')`, `test('...')`), `tests/Feature/`, `tests/Unit/`, Laravel factories

## Swift

**Config files**: `Package.swift`, `*.xcodeproj`, `*.xcworkspace`, `Podfile`, `Cartfile`
**Entry points**: `@main`, `AppDelegate.swift`, `SceneDelegate.swift`, `main.swift`, `App.swift` (SwiftUI)
**Frameworks**: Vapor (`routes.swift`, `app.get/post`), SwiftUI (`View`, `@State`, `@ObservedObject`), UIKit (`UIViewController`), Combine, async/await concurrency
**ORM/DB**: Fluent (Vapor ORM — `Model`, `@Field`, `Migration`), Core Data (`NSManagedObject`), GRDB, SQLite.swift, Realm
**Route detection**: Vapor `app.get/post/grouped`, SwiftUI `NavigationStack`/`NavigationLink`
**Business logic signals**: Protocol-oriented design, `enum` with associated values for state machines, `guard` statements for validation, `Result` type for error handling, Combine publishers for reactive logic
**Test patterns**: XCTest (`func test*`, `XCTAssert*`), Swift Testing (`@Test`), `Tests/` directory

## C / C++

**Config files**: `CMakeLists.txt`, `Makefile`, `meson.build`, `conanfile.txt`, `vcpkg.json`, `.clang-format`
**Entry points**: `main.c`/`main.cpp`, `src/main.*`, `int main()`
**Frameworks**: Qt (`QApplication`, `QWidget`, signals/slots), Boost, gRPC C++ (`Service::AsyncService`), Crow/Drogon (web), POCO, cpprestsdk
**ORM/DB**: ODB (`#pragma db`), sqlpp11, SOCI, raw SQL with libpq/mysql-connector, SQLite3 C API
**Route detection**: Crow/Drogon route macros, gRPC service definitions (`.proto`), REST endpoint registration
**Business logic signals**: Class hierarchies with virtual methods, `enum class` state machines, `assert()` / custom validators, callback patterns, `std::variant` for sum types
**Test patterns**: Google Test (`TEST`, `TEST_F`, `EXPECT_*`), Catch2 (`TEST_CASE`, `REQUIRE`), CTest, `test/` or `tests/` directory

## Perl

**Config files**: `Makefile.PL`, `Build.PL`, `cpanfile`, `dist.ini`, `.perltidyrc`
**Entry points**: `app.psgi`, `script/*.pl`, `bin/*.pl`, `cgi-bin/*.cgi`
**Frameworks**: Mojolicious (`get '/' => sub`), Dancer2 (`get '/' => sub`), Catalyst (`sub index :Path :Args(0)`), CGI.pm, Plack/PSGI
**ORM/DB**: DBIx::Class (`__PACKAGE__->table`, `has_many`, `belongs_to`), DBI (raw SQL), Rose::DB::Object, SQL::Abstract
**Route detection**: Mojolicious/Dancer2 route DSL, Catalyst action attributes (`:Path`, `:Local`, `:Chained`)
**Business logic signals**: Moose/Moo classes with `has` attributes and `BUILD`, `sub validate_*`, `Type::Tiny` constraints, `try/catch` blocks
**Test patterns**: Test::More (`ok`, `is`, `done_testing`), Test::Class, `t/*.t` files, `prove`

## Scala

**Config files**: `build.sbt`, `project/build.properties`, `application.conf` (HOCON), `project/plugins.sbt`
**Entry points**: `object Main extends App`, `def main(args: Array[String])`, `extends IOApp`
**Frameworks**: Play Framework (`routes` file, `Controller`, `Action`), Akka HTTP (`path("api")`, `get`, `post`), http4s (`HttpRoutes`), ZIO HTTP, Finch, Scalatra
**ORM/DB**: Slick (`TableQuery`, `table`), Doobie (`sql"..."`, `Query0`), Quill, ScalikeJDBC, Phantom (Cassandra)
**Route detection**: Play `routes` file, Akka HTTP DSL, http4s `HttpRoutes.of`
**Business logic signals**: Case classes as domain models, sealed traits for ADTs/state machines, `Either`/`Validated` for error handling, Cats/ZIO effect types, pattern matching on domain types
**Test patterns**: ScalaTest (`describe/it/should`), Specs2, MUnit, `src/test/scala/`, ScalaCheck (PBT)

## Elixir / Erlang

**Config files**: `mix.exs`, `config/*.exs`, `rebar.config` (Erlang), `rel/config.exs`
**Entry points**: `lib/*/application.ex` (`start/2`), `lib/*_web/endpoint.ex`, `rel/`
**Frameworks**: Phoenix (`router.ex`, `*Controller`, `*Live`), Plug (`plug :match`, `plug :dispatch`), Absinthe (GraphQL), Nerves (IoT)
**ORM/DB**: Ecto (`schema`, `has_many`, `belongs_to`, `changeset`), `priv/repo/migrations/`, Mnesia (Erlang)
**Route detection**: Phoenix `router.ex` (`pipe_through`, `get`, `post`, `resources`), `scope` blocks
**Business logic signals**: GenServer state machines, `with` chains for business flows, Ecto changesets with validations, `defmodule *Policy`, pattern matching on structs, `@behaviour` callbacks
**Test patterns**: ExUnit (`test "..."`, `describe`, `assert`), `test/` directory, `mix test`, Mox for mocking

## Clojure

**Config files**: `deps.edn`, `project.clj` (Leiningen), `shadow-cljs.edn`, `resources/config.edn`
**Entry points**: `-main` function, `mount/defstate`, `integrant` system config
**Frameworks**: Ring (`defroutes`, middleware), Compojure (`GET`, `POST`, `defroutes`), Reitit (`["/api" [...]]`), Pedestal, Luminus
**ORM/DB**: next.jdbc, HoneySQL, HugSQL (`-- :name query`), Datomic (`d/q`, `d/transact`), XTDB
**Route detection**: Compojure macros, Reitit data-driven routes, Ring handler functions
**Business logic signals**: `spec/def` and `spec/fdef` for validation, multimethods (`defmulti`/`defmethod`) for polymorphism, `core.async` channels, transactional functions
**Test patterns**: `clojure.test` (`deftest`, `is`, `testing`), `test/` directory, `test.check` (PBT), Midje

## Haskell

**Config files**: `package.yaml`, `*.cabal`, `stack.yaml`, `cabal.project`
**Entry points**: `app/Main.hs`, `src/Main.hs`, `main :: IO ()`
**Frameworks**: Servant (`type API = ...`, `Server API`), Scotty (`get "/path"`, `post "/path"`), Yesod (`mkYesod`, `parseRoutes`), IHP
**ORM/DB**: Persistent (`share [mkPersist]`, `Entity`), Beam, Opaleye, Hasql, Esqueleto
**Route detection**: Servant type-level API definitions, Scotty/Yesod route DSL
**Business logic signals**: ADTs (`data`/`newtype`) for domain types, `Either`/`ExceptT` for error handling, type classes for behavior, `where` clauses with business logic, smart constructors (`mk*` functions)
**Test patterns**: Hspec (`describe/it/shouldBe`), Tasty, QuickCheck/Hedgehog (PBT), `test/` directory

## Lua

**Config files**: `rockspec` files, `.luacheckrc`, `conf/nginx.conf` (OpenResty)
**Entry points**: `init.lua`, `main.lua`, `app.lua`, `nginx.conf` (OpenResty)
**Frameworks**: OpenResty/Lapis (`app:get("/path")`, `app:post`), Lor, Sailor, LÖVE (game dev)
**ORM/DB**: LuaSQL, pgmoon (PostgreSQL), lua-resty-mysql, redis via lua-resty-redis
**Route detection**: Lapis route definitions, OpenResty `location` blocks, Lor route DSL
**Business logic signals**: Module tables with methods, metatables for OOP, `assert()` for validation, coroutines for async flows
**Test patterns**: Busted (`describe/it/assert`), LuaUnit, `spec/` directory

## COBOL

**Config files**: `JCL` files, `COPY` members, `CICS` definitions, batch job definitions
**Entry points**: `IDENTIFICATION DIVISION`, `PROCEDURE DIVISION`, `PROGRAM-ID`
**Frameworks**: CICS (online transactions), IMS, batch JCL, MQ Series interfaces
**Data access**: Embedded SQL (`EXEC SQL`), VSAM (`READ`, `WRITE`, `REWRITE`), DB2 (`EXEC SQL`), IMS DL/I calls, flat file I/O (`READ`/`WRITE`)
**Route detection**: CICS `EXEC CICS RECEIVE MAP` / `SEND MAP`, transaction IDs, program-to-program calls (`EXEC CICS LINK`)
**Business logic signals**: `PERFORM` paragraphs with business names, `EVALUATE`/`WHEN` (switch), `IF` chains with business conditions, `COMPUTE` statements, `88-level` condition names, `COPY` members for shared data structures
**Test patterns**: COBOL unit test frameworks (zUnit, COBOL-Check), JCL test jobs, `DISPLAY` debugging

## Fortran

**Config files**: `CMakeLists.txt`, `Makefile`, `fpm.toml` (Fortran Package Manager)
**Entry points**: `program main`, `program *`, `*.f90`, `*.f`
**Frameworks**: Mostly custom — scientific computing libraries, MPI for parallel, OpenMP for threading
**Data access**: HDF5, NetCDF, raw file I/O (`OPEN`/`READ`/`WRITE`), database via C bindings
**Business logic signals**: `SUBROUTINE` and `FUNCTION` with domain names, `MODULE` for encapsulation, `SELECT CASE` for branching, `INTERFACE` blocks for polymorphism, numerical algorithms
**Test patterns**: pFUnit, FRUIT, `test/` directory, assertion subroutines

## Visual Basic / VBA / VB.NET

**Config files**: `*.vbproj`, `*.sln`, `app.config`, `web.config`, `*.xlsm` (VBA in Excel)
**Entry points**: `Sub Main()`, `Module1.vb`, `ThisWorkbook` (VBA), `Global.asax` (ASP.NET)
**Frameworks**: ASP.NET Web Forms (`*.aspx`, `*.aspx.vb`), WinForms (`*.Designer.vb`), WPF, VBA in Office
**ORM/DB**: Entity Framework, ADO.NET (`SqlConnection`, `SqlCommand`), LINQ, DAO/ADO (VBA/Access)
**Route detection**: ASP.NET `RouteConfig`, Web Forms page URLs, WCF service contracts
**Business logic signals**: `Function`/`Sub` with business names, `Select Case`, `If...Then...ElseIf` chains, `Class` modules with validation methods, Excel formula logic in VBA
**Test patterns**: MSTest, NUnit (VB.NET), no standard for VBA (manual testing common)

## Delphi / Object Pascal

**Config files**: `*.dproj`, `*.dpr` (project file), `*.dfm` (form definitions), `*.dpk` (packages)
**Entry points**: `program` declaration in `*.dpr`, `Application.Initialize`, `Application.Run`
**Frameworks**: VCL (Windows), FMX/FireMonkey (cross-platform), DataSnap (REST), RAD Server, IntraWeb
**ORM/DB**: FireDAC (`TFDConnection`, `TFDQuery`), dbExpress, ADO (`TADOQuery`), direct SQL, IBX (InterBase)
**Route detection**: DataSnap `TDSHTTPService`, RAD Server resource endpoints, IntraWeb page classes
**Business logic signals**: `procedure`/`function` with business names, `case...of` statements, `class` with `property` declarations, `raise Exception` for validation, event handlers (`OnClick`, `OnValidate`)
**Test patterns**: DUnit, DUnitX (`[Test]` attribute), `TestCase` classes

## Classic ASP / ASP.NET Web Forms

**Config files**: `web.config`, `global.asa`/`Global.asax`, `*.asp`/`*.aspx`, IIS configuration
**Entry points**: `default.asp`/`Default.aspx`, `Global.asax` (`Application_Start`)
**Frameworks**: Classic ASP (VBScript/JScript in `*.asp`), ASP.NET Web Forms (`*.aspx` + `*.aspx.cs`/`*.aspx.vb`), ASP.NET MVC (older versions)
**Data access**: ADO (`ADODB.Connection`, `ADODB.Recordset`), ADO.NET (`SqlDataAdapter`, `DataSet`), stored procedures, inline SQL
**Route detection**: URL = file path (Classic ASP), `RouteConfig.cs` (MVC), page URLs (Web Forms)
**Business logic signals**: Server-side `<% %>` blocks with business logic, code-behind files (`*.aspx.cs`), `Page_Load` event handlers, `Validate*` methods, `Session`/`Application` state management
**Test patterns**: MSTest, NUnit (ASP.NET), limited for Classic ASP

## Business Rule Extraction Heuristics

Regardless of language, look for these patterns:

| Signal | What It Indicates |
|---|---|
| `if/switch` on status/state fields | State machine or workflow |
| Validation functions with error returns | Business validation rules |
| Functions named `calculate*`, `compute*`, `derive*` | Business calculations |
| Role/permission checks before operations | Authorization rules |
| Assertions or guard clauses at function start | Invariants |
| Cron/scheduler configurations | Scheduled business processes |
| Event handlers / message consumers | Event-driven business logic |
| Constants with business meaning (rates, limits, thresholds) | Business parameters |
| Enum types with domain names | Domain concepts / state definitions |
