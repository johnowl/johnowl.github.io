---
layout: post
title: Testes com Micronaut, Kotlin, JUnit e Mockito
comments: true
categories: 
    - GraalVM
    - Micronaut Framework
    - Java
    - Kotlin
    - Testes
description: Como escrever testes para validar nosso Hello World? Veja como testar seus controllers do Micronaut, como construir mocks e alterar configurações para seus testes.
image: /public/images/2021-07-12/testing.jpg
---

## Introdução

Em nosso post anterior, nós fizemos um [Hello World usando Micronaut]({{site.baseurl}}/hello-world-com-kotlin-micronaut-e-graalvm/), um teste de carga e comparamos a performance dele usando a compilação JIT e AOT. Mas não passamos por um tópico muito importante: como escrever testes para validar nossa aplicação Micronaut. Nesse post vamos usar ferramentas de testes muito conhecidas no mundo Java: JUnit e Mockito. Além do JUnit, o Micronaut dá suporte para [Kotest](https://kotest.io/) e [Spock](https://spockframework.org/), mas estão fora do escopo desse artigo.

## Validando controllers

Nosso Hello World não tem lógica de negócio, é apenas um controller que retorna um DTO, e validar um Controller usando o Micronaut é bastante simples. Veja o exemplo abaixo:

```kotlin
@MicronautTest
class HelloControllerTest {

    @Inject
    @field:Client("/")
    lateinit var httpClient: HttpClient

    @Test
    fun `should return Hello World message`() {
        val response = httpClient.toBlocking().retrieve("/", Message::class.java)
        assertEquals("Hello world!", response.message)
    }

}
```

Para validar um controller adicionamos a anotação `@MicronautTest` e injetamos um `HttpClient` para chamar a API desejada. Veja que não estamos escrevendo um teste unitário, pois a nossa aplicação irá executar e retornar um resultado real. Quando executamos esse teste o Micronaut vai subir nossa aplicação e injetar um `httpClient` apontando para ela. Dessa forma conseguimos fazer chamadas de APIs e validar o seu resultado. Não se preocupe muito com o `HttpClient`, vou escrever um post exclusivo sobre ele.

## Criando mocks de classes com Mockito

O primeiro passo é adicionar as dependências abaixo em nosso arquivo `build.gradle.kts`.

```kotlin
dependencies {
    // várias outras dependências aqui
    testImplementation("org.mockito:mockito-core") 
    testImplementation("org.mockito.kotlin:mockito-kotlin:3.2.0")
}
```

Quando estamos escrevendo testes de unidade é comum o uso de mocks de classes para isolar nosso cenário de teste. Dessa forma é possível não depender de outros sistemas, além de facilitar a construção de cenários. Veja a classe abaixo, ela depende de um repositório que acessa um banco de dados:

```kotlin
@Singleton
class ProductService(
    private val productRepository: ProductRepository
) {
    fun save(product: Product) {
        if (productRepository.findById(product.id) != null) {
            throw IllegalArgumentException("Product already exists")
        }

        productRepository.save(product)
    }
}
```

Para não depender do banco de dados queremos criar um mock do repositório. Para fazer isso basta criar em nossa classe de teste um método anotado com `@MockBean(ClasseQueSeraMockada::class)` que retorna o mock. Esse método serve para a injeção de dependência do Micronaut trocar a classe real pela classe mockada.

```kotlin
@MockBean(ProductRepository::class)
fun productRepository(): ProductRepository {
    return mock(ProductRepository::class.java)
}
```

Veja o teste completo a seguir. Note que usamos o `productRespository` que foi injetado na classe para configurar seu comportamento ao invés de chamar o método `productRepository()`

```kotlin
@MicronautTest
class ProductTest {

    @Inject
    lateinit var productService: ProductService // (1)

    @Inject
    lateinit var productRepository: ProductRepository // (2) 

    @MockBean(ProductRepository::class)
    fun productRepository(): ProductRepository {
        return mock(ProductRepository::class.java) // (3)
    }    

    @Test
    fun `when saving a product, should throw IllegalStatementException when product already exists`() {

        val response = Product("1", "Produto 1")
        whenever(productRepository.findById("1")).thenReturn(response) // (4)

        assertThrows<IllegalArgumentException> {
            productService.save(Product("1", "Produto 1"))
        }
    }
}
```

Veja o que significam os comentários numerados do código acima:

1. Injeto a classe que será testada
2. Injeto a dependência que será mockada
3. Crio um mock para productRepository
4. Configuro o comportamento do mock

## Fornecendo configurações para seu teste

Algumas vezes queremos sobrescrever configurações para rodar nossos testes, veja o controller abaixo.

```kotlin
@Controller
class ConfigController(
    @Value("\${app.message:Good Bye.}") val config: String
) {

    @Get("/config")
    fun config(): Message {
        return Message(config)
    }

}
```

O controller recebe uma configuração no seu construtor, caso a configuração não exista o valor "Good Bye." será usado. Para sobrescrever essa configuração podemos usar a anotação `@Property(name = "app.message", value = "E aí?!")`, essa anotação pode ser usada tanto para toda a classe de teste como para um teste específico conforme exemplo que segue.

```kotlin
@MicronautTest
class ConfigControllerTest {

    @Inject
    @field:Client("/")
    lateinit var httpClient: HttpClient

    @Test
    @Property(name = "app.message", value = "E aí?!") // (1) anotação em um teste específico
    fun `should return configured message using TestPropertyProvider`() {
        val response = httpClient.toBlocking().retrieve("/config", Message::class.java)
        Assertions.assertEquals("E aí?!", response.message)
    }
}
```

O Micronaut também oferece uma interface chamada `TestPropertyProvider`, com ela é possível fazer o setup de alguma ferramenta, ler os valores dela e repassar para a aplicação como configurações. Para utilizá-la, seu teste precisa implementá-la e sobrescrever o método `getProperties` que retorna um `MutableMap<String, String>` com as configurações necessárias, além disso, é preciso adicionar a anotação `@TestInstance(TestInstance.Lifecycle.PER_CLASS)` na sua classe de teste. 

```kotlin
@MicronautTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ConfigControllerTest : TestPropertyProvider {

    @Inject
    @field:Client("/")
    lateinit var httpClient: HttpClient

    @Test
    fun `should return configured message using TestPropertyProvider`() {
        val response = httpClient.toBlocking().retrieve("/config", Message::class.java)
        Assertions.assertEquals("E aí?!", response.message)
    }

    override fun getProperties(): MutableMap<String, String> {

        // faz o setup de alguma ferramenta aqui e lê informações dela

        return mutableMapOf(
            "app.message" to "E aí?!"
        )
    }
}
```
