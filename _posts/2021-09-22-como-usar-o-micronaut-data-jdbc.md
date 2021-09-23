---
layout: post
title: Como usar o Micronaut Data JDBC
comments: true
categories: 
    - Micronaut
    - Kotlin
    - Micronaut Data
    - Micronaut Data JDBC
    - Database
description: Aprenda o que você pode fazer com o Micronaut Data JDBC.
image: /public/images/2021-09-22/rocket.jpeg
---

## Introdução

O Micronaut Data trouxe para o acesso a dados as vantagens já conhecidas do Micronaut Framework: trabalho duro sendo executado em tempo de compilação ao invés tempo de execução. As vantagens dessa abordagem é o menor uso de memória e tempo de inicialização mais rápido da sua aplicação.

Nesse artigo mostramos o Micronaut Data JDBC, uma camada fina que, em tempo de compilação, implementa seus repositórios e gera as queries SQL para acesso a dados em bancos relacionais. O Micronaut Data JDBC não é um ORM, ele não possui alguns recursos avançados como Lazy Loading, Dirty Checking ou Cache de primeiro nível.

Os dialetos de SQL compatíveis são:

* The H2 database
* MySQL 5.5 ou acima
* Postgres 9.5 ou acima
* SQL Server 2012 ou acima
* Oracle 12c ou acima

## Como usar o Micronaut Data JDBC

Para usar o Micronaut Data JDBC você precisa conhecer dois conceitos:

1. Entidade
2. Repositório

Um entidade é basicamente uma classe que representa sua tabela no banco de dados. O repositório é uma interface com métodos para adicionar, atualizar, consultar ou remover registros das suas tabelas. Essa interface é implementada pelo Micronaut Data em tempo de compilação. Veja um exemplo:

```kotlin
@MappedEntity("users") // (1)
data class User(

    @field:Id // (2)
    @field:GeneratedValue // (3)
    val id: Long? = null,

    val name: String,
    val email: String
)

@JdbcRepository(dialect = POSTGRES) // (4)
interface UserRepository : CrudRepository<User, Long> // (5)
```

Como podemos ver no exemplo acima, além de definir a entidade e o repositório, precisamos adicionar algumas anotações neles. Veja o que elas significam:

1. Indicamos que nossa `data class` é um entidade e que o nome da tabela é `users`.
2. Definimos que o campo `id` deve ser considerado como chave primária na tabela.
3. Indicamos que a chave primária deve ser gerada pelo banco de dados.
4. Indicamos que nosso repositório é do tipo `JDBC` e que o banco de dados usado será o PostgreSQL.
5. Nossa interface herda de outra interface, aqui informamos qual é a entidade e o tipo da chave primária.

Pronto! Agora temos como injetar o repositório em alguma classe e usá-lo para inserir, consulta, apagar ou atualizar dados. Veja alguns métodos disponíveis:

```kotlin
// Adiciona um novo usuário e retorna 
// uma instância da classe com o id gerado
val savedUser = repository.save(User(
    name = "João Paulo", 
    email = "joaopaulo@email.com.br"
))

// Retorna todos os usuários
val allUsers = repository.findAll()

// Atualiza o usuário
repository.update(User(1, "João Paulo", "john@mail.com"))

// Retorna um usuário pelo Id ou null caso não exista
val user = repository.findById(1).orElse(null)

// Apaga um usuário pelo Id
repository.deleteById(1)
```

## Como o Micronaut Data JDBC funciona

Ao compilar sua aplicação o Micronaut irá implementar as classes e gerar todas as queries. É possível ver que realmente os comandos SQL foram gerados em tempo de compilação. Veja como:

1. Fazer build do projeto.
2. Abrir o diretório build/lib e trocar a extensão do arquivo `nome-do-seu-projeto-0.1-all.jar` de `.jar` para `.zip` e descompactá-lo.
3. Navegar até até o pacote onde você declarou seu repositório, no meu caso era com.johnowl.
4. Dentro do Intellij, dar um duplo clique no arquivo `$UserRepository$Intercepted$Definition$Exec.class` para que o arquivo seja convertido de byte code para código Java.
5. Procure por `SELECT`, você vai ver um código bem complexo que foi gerado em tempo de compilação, abaixo segue um exemplo de parte dele:

```java
AnnotationUtil.mapOf("value", "SELECT user_entity_.\"id\",user_entity_.\"name\" FROM \"users\" user_entity_ WHERE (user_entity_.\"id\" = ?)")
```

Além de gerar os comandos SQL para manipular os dados, o framework pode gerar automaticamente as tabelas para sua aplicação. Esse é um recurso muito interessante para tempo de desenvolvimento ou testes, mas não é recomendado em ambiente produtivo. Para isso é recomendado o uso de ferramentas com o [Flyway](https://flywaydb.org/) ou [Liquibase](https://www.liquibase.org/). A configuração para criação das tabelas é definida no arquivo de configuração da aplicação, no campo `schema-generate`. Os valores possíveis são CREATE, CREATE_DROP E NONE. Veja um exemplo:

```yaml
datasources:
  default:
    url: jdbc:postgresql://localhost:5432/postgres
    driverClassName: org.postgresql.Driver
    username: postgres
    password: ''
    schema-generate: CREATE_DROP
    dialect: POSTGRES
```

## É possível definir múltiplas conexões com bancos de dados

No código `yaml` do capítulo anterior, percebeu na segunda linha o nome `default`? É possível ter mais de um `datasource`, basta adicionar outra configuração trocando a palavra `default` por um nome significativo e depois indicar no repositório qual fonte de dados ele deve usar. Veja como:

```yaml
datasources:
  default:
    url: jdbc:postgresql://server1:5432/postgres
    driverClassName: org.postgresql.Driver
    username: postgres
    password: ''
    schema-generate: CREATE_DROP
    dialect: POSTGRES
  other: // (1)
    url: jdbc:postgresql://server2:5432/postgres
    driverClassName: org.postgresql.Driver
    username: postgres
    password: ''
    schema-generate: CREATE_DROP
    dialect: POSTGRES
```

```kotlin
@Repository("other") // (2)
@JdbcRepository(dialect = POSTGRES)
interface UserRepository : CrudRepository<UserEntity, Long>
```

Veja o que fizemos:

1. Nomeamos nosso segundo data source como `other` no arquivo de configurações.
2. Adicionamos a anotação `Repository` com o nome do data source na interface que define nosso repositório.

## Mapeando relacionamentos entre tabelas

Um dos conceitos mais importantes do bancos de dados relacionais são os relacionamentos. Com Micronaut Data JDBC é possível usar anotações para definir o relacionamento entre as entidades. Vamos ver 3 tipos de relacionamentos: um pra um, um pra muitos e muitos para muitos.

## Relacionamento um para um (1:1)

O tipo de relacionamento mais simples é o relacionamento um para um. Nesse tipo de relacionamento a entidade A só pode estar associada no máximo a uma entidade B e a entidade B pode estar associada a uma entidade A. Veja esse tipo de relacionamento num exemplo em que uma pessoa pode ter um único documento de RG:

```kotlin
@MappedEntity
data class User(

    @field:Id @field:GeneratedValue
    val id: Long? = null,

    @field:Relation(Relation.Kind.ONE_TO_ONE, cascade = [Relation.Cascade.PERSIST, Relation.Cascade.UPDATE])
    val rg: Rg,

    val name: String,
    val email: String,

)

@MappedEntity
data class Rg(
    @field:Id @field:GeneratedValue
    val id: Long? = null,
    val number: String,
    val state: String,
    val emissionDate: LocalDate
)
```

Veja que adicionamos uma nova anotação no campo RG. Essa anotação possui duas informações imporantes:

1. O tipo do relacionamento, onde indicamos que é do tipo ONE_TO_ONE.
2. O campo `cascade` que indica que a entidade RG deve ser gravada automaticamente quando ocorrer uma inclusão e uma atualização da entidade `User`. Além dessas duas opções existe a opção `NONE`, que nunca irá gravar a entidade RG automaticamente.

---

Até o momento o Micronaut Data JDBC não suporta o `DELETE CASCADE`, ou seja, se você quiser apagar a entidade `User` e a `RG`, é preciso fazer uma chamada para cada deleção.

---

Agora que já defini a entidade e o repositório, o que acontece quando eu executar o código abaixo?

```kotlin
val savedUser = repository.save(User(
    name = "João Paulo",
    email = "joaopaulo@email.com.br",
    rg = Rg(
        number = "123-X",
        state = "SP",
        emissionDate = LocalDate.parse("2007-12-03")
    )
))
```

Duas tabelas serão populadas:

1. A tabela `rg` será populada com os valores dos campos `number`, `state`, `emissionDate` e o campo `id` irá receber um número inteiro sequencial, se for a primeira inserção será o número 1.
2. A tabela `user` será populada com os valores dos campos `name`, `email`, o campo `id` também receberá um valor sequencial e o campo `rg_id` irá receber o valor do campo `id` gerado para o registro inserido na tabela `rg`. O campo `rg_id` é chamado de chave estrangeira.

Consulta efetuada no banco de dados PostgreSQL:

```text
postgres=# select * from public.rg;
 id | number | state | emission_date 
----+--------+-------+---------------
  1 | 123-X  | SP    | 2007-12-03
(1 row)

postgres=# select * from public.user;
 id | rg_id |    name    |         email          
----+-------+------------+------------------------
  1 |     1 | João Paulo | joaopaulo@email.com.br
(1 row)
```

## Relacionamento um para muitos (1:N)

No relacionamento um para muitos a entidade A pode estar associada a nenhuma, uma ou várias entidades B. Já cada entidade B só pode estar associada a uma entidade A. Veja um exemplo de um usuário que pode ter vários veículos.

```kotlin
@MappedEntity
data class User(

    @field:Id @field:GeneratedValue
    val id: Long? = null,

    @field:Relation(
        Relation.Kind.ONE_TO_MANY, // (1)
        cascade = [Relation.Cascade.PERSIST, Relation.Cascade.UPDATE], 
        mappedBy = "user" // (2)
    )
    val vehicles: List<Vehicle>, // (3)

    val name: String,
    val email: String,

)

@MappedEntity
data class Vehicle(
    @field:Id @field:GeneratedValue
    val id: Long? = null,

    val user: User? = null, // (4)

    val model: String,
    val builder: String,
    val licensePlate: String
)
```

Fiz um teste executando esse insert:

```kotlin
userRepository.save(
    User(
        name = "João Paulo",
        email = "joaopaulo@email.com.br",
        vehicles = listOf(
            Vehicle(
                builder = "VW",
                model = "Golf",
                licensePlate = "123ABC"
            )
        )
    )
)
```

Veja as tabelas criadas e dados adicionaos no PostgreSQL:

```text
postgres=# select * from public.user;
 id |    name    |       email       
----+------------+-------------------
  1 | João Paulo | joaopaulo@email.com.br
(1 row)

postgres=# select * from public.vehicle;
 id | user_id | model | builder | license_plate 
----+---------+-------+---------+---------------
  1 |       1 | Golf  | VW      | 123ABC
(1 row)
```

1. Tipo do relacionamento usado é ONE_TO_MANY.
2. Adicionamos uma nova propriedade que indica qual campo contém a referência da entidade A.
3. Como um usuário pode ter mais de um veículo, usamos uma lista.
4. Propriedade para guardar a referência da entidade A, no banco de dados ela será transformada em um campo chamado `user_id` caso você estja usando a geração automática de schema do Micronaut.

## Relacionamento muitos para muitos (M:N)

No relacionamento muitos para muitos as entidades A e B são independentes, ou seja, tanto A pode existir sem B tanto B pode existir sem A. Um exemplo disso são hashtags, um hashtag pode existir no seu banco de dados sem estar associada a nada, e um texto pode existir sem possuir nenhuma hashtag associada. Além disso, a mesma hashtag pode estar associada a vários textos diferentes, e um texto pode ter várias hashtags diferentes associadas a ele. Para fazer esse tipo de mapeamento é criada uma terceira tabela, que faz a ligação entre a chave primária da entidade A com a chave primária da entidade B. Veja um exemplo de como fazer esse mapeamento usando o Micronaut Data JDBC:

```kotlin
@MappedEntity
data class Text(

    @field:Id @field:GeneratedValue
    val id: Long? = null,

    @field:Relation(
      Relation.Kind.MANY_TO_MANY, // (1)
      cascade = [Relation.Cascade.ALL] // (2)
    )
    val tags: List<Tag>,

    val title: String,
    val content: String
)

@MappedEntity
data class Tag( // (3)
    @field:Id @field:GeneratedValue
    val id: Long? = null,
    val name: String
)
```

1. Adicionamos a anotação com o tipo de relacionamento muitos para muitos.
2. Nesse caso, ao marcar o cascade como ALL, estamos dizendo que a tabela que associa textos a tags deve ser preenchida. Aqui é preciso atenção, pois se uma hashtag não existe na tabela de tags, ela não será cadastrada mas será adicionada na tabela intermediária que associa tags a textos.
3. A classe `Tag` possui somente a chave primária e demais propriedades.

Aqui fiz um teste executando o insert abaixo, sem existir nenhuma tag cadastrada na minha tabela de tags:

```kotlin
userRepository.save(Text(
    title = "Lipsum",
    content = "Lorem ipsum dolor sit amet",
    tags = listOf(
      Tag(id = 1, name = "kotlin"), 
      Tag(id = 2, name = "micronaut"), 
      Tag(id = 3, name = "jdbc")
    )
))
```

Ao consultar as informações no PostgreSQL, o resultado foi esse:

```text
postgres=# select * from public.text;
 id | title  |          content           
----+--------+----------------------------
  1 | Lipsum | Lorem ipsum dolor sit amet
(1 row)

postgres=# select * from public.text_tag;
 text_id | tag_id 
---------+--------
       1 |      1
       1 |      2
       1 |      3

postgres=# select * from public.tag;
 id | name 
----+------
(0 rows)
```

Perceba que as tabelas `text` e `text_tag` (tabela que associa textos a tags) estão preenchidas, mas a tabela `tag` está vazia. Nesse caso é preciso criar um repositório para as tags e cadastrá-las conforme exemplificado abaixo:

```kotlin
@JdbcRepository(dialect = POSTGRES)
interface TagRepository : CrudRepository<Tag, Long>

tagRepository.save(Tag(name = "kotlin"))
tagRepository.save(Tag(name = "micronaut"))
tagRepository.save(Tag(name = "jdbc"))
```

## Unindo tabelas (joins)

Se você usar o método `findById`, `listAll` ou qualquer outro método de consulta de um repositório, mesmo se você tiver mapeado que a entidade possui entidades filhas, elas não serão trazidas na consulta. Você precisa deixar isso específico para que as entidades filhas sejam retornadas. Para isso existe uma anotação `@Join` que você pode usar nos métodos do seu repositóio.

```kotlin
@JdbcRepository(dialect = POSTGRES)
interface UserRepository : CrudRepository<Text, Long> {
    fun findByName(name: String): Optional<Text>

    @Join(value = "tags", type =  Join.Type.LEFT_FETCH)
    override fun findAll(): MutableIterable<Text>

    @Join(value = "tags", type = Join.Type.LEFT_FETCH)
    override fun findById(id: Long?): Optional<Text>
}
```

Os tipos de joins suportados pelo Micronaut Data JDBC são:

| Tipo         | Descrição                                                |
|--------------|----------------------------------------------------------|
| LEFT         | Faz um LEFT JOIN sem trazer as entidades filhas          |
| RIGHT        | Faz um LEFT JOIN sem trazer as entidades filhas          |
| INNER        | Faz um INNER JOIN sem trazer as entidades filhas         |
| LEFT_FETCH   | Faz um LEFT JOIN trazendo os dados das entidades filhas  |
| RIGHT_FETCH  | Faz um RIGHT JOIN trazendo os dados das entidades filhas |
| FETCH        | Faz um INNER JOIN trazendo os dados das entidades filhas |

Caso sua entidade tenha mais de um relacionamento, é possível trazer todas as informações, basta adicionar mais de um Join usando a anotação `@JoinSpecifications`:

```kotlin
@JdbcRepository(dialect = POSTGRES)
interface UserRepository : CrudRepository<Text, Long> {
    @JoinSpecifications(
        Join(value = "tags", type = Join.Type.LEFT_FETCH),
        Join(value = "authors", type = Join.Type.FETCH)
    )
    override fun findById(id: Long?): Optional<Text>
}
```

## Consultas personalizadas

O Micronaut oferece uma forma de escrever consultas personalizadas diretamente nas interfaces usando código Kotlin ou Java. O nome do método da interface descreve a consulta que será feita. Veja um exemplo de como  consultar todos os livros que tem mais de N páginas e ordená-los pela data de inclusão decrescente:

```kotlin
@JdbcRepository(dialect = POSTGRES)
interface UserRepository : CrudRepository<Book, Long> {
    fun findByPagesGreaterThanOrderByDateCreatedDesc(pages: Long): List<Book>
}
```

A consulta SQL será gerada em tempo de compilação a partir dos nomes dos métodos do repositório. Para mais detalhes [consulte a documentação de como escrever consultas](https://micronaut-projects.github.io/micronaut-data/latest/guide/#querying).

## Conclusão

Como vimos no artigo anterior, o Micronaut Data JDBC possui uma performance excelente para tralharmos com bancos de dados relacionais. No artigo atual vimos que ele não é um ORM, é um mapeador entre as tabelas de um banco de dados e as classes do seu projeto. Mesmo assim, ele traz alguns conceitos muito parecidos de ORMs como Spring JPA ou Hibernate para mapeamento de entidades e criação de repositórios.

Sua principal vantagem é acelerar o desenvolvimento pois o desenvolvedor não precisa escrever código SQL para manipular um banco de dados, pode fazer tudo isso usando Kotlin.
