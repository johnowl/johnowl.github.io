---
layout: post
title: Gatling oferece DSL para Kotlin e Java
comments: true
categories: 
    - Gatling
    - Kotlin
    - Test
    - Load Test
    - Performance Test
description: Veja duas formas de configurar o Logback para formatar os logs em Json. Uma forma é usando o arquivo de configuração do Logback e a outra é programaticamente usando Kotlin.
image: /public/images/2022-03-27/speed-small.jpg
---

## Introdução

Gatling é uma ferramenta para testes de carga em aplicações web. Até a versão 3.6 era possível escrever testes somente usando a linguagem de programação Scala. A partir da versão 3.7 é possível também escrever testes usando as linguagens Java ou Kotlin.

Neste artigo vamos ver como escrever um teste de carga usando a linguagem Kotlin e o plugin do Gatling para Gradle.

## Pré requisitos

1. JDK 8 ou superior
2. Git
3. IntelliJ

## Criando seu projeto

Crie um novo projeto usando sua IDE favorita, aqui eu vou usar o Intellij Community version. O projeto precisa ser na linguagem Kotlin e você precisa escolher o gradle como ferramenta de build.

1. Selecione a opção "File > New Project"
2. Do lado esquerdo, selecione a opção "Gradle"
3. Do lado direito selecione a versão da JDK que quer usar,  marque a opção "Use kotlin DSL", demarque a opção "Java" e marque a opção "Kotlin/JVM"
4. Na próxima tela escolha um nome para se projeto e clique em "Finish".

## Adicionando o plugin do Gatling no Gradle

Abra o arquivo build.gradle.kts e adicione o novo plugin conforme exemplo abaixo:

```kotlin
plugins { 
    kotlin("jvm") version "1.6.10" 
    id("io.gatling.gradle") version "3.7.6.1" 
}
```

Neste exemplo estamos usando a versão 3.7.6.1, para ver qual é a última versão do plugin acesse a página do [plugin para Gradle](https://plugins.gradle.org/plugin/io.gatling.gradle).

Após adicionar o plugin selecione a opção "Reload"do Gradle, basta clicar no elefante que aparecerá na tela.

Por padrão, os gatling espera que as simulações fiquem no diretório `src/gatling/kotlin`. Então vamos criar esse diretório, clique com o botão direito do mouse no diretório `src`, selecione New, depois Directory e na caixa de opções selecione `gatling/kotlin`.

Pronto, agora podemos começar a escrever nossa primeira simulação.

## Escrevendo uma simulação do Gatling com Kotlin

Crie um novo pacote chamado `com.johnowl.simulations` no diretório `src/gatling/kotlin`.

Adicione uma nova classe chamada BasicSimulation no pacote recém criado.

Adicione os imports abaixo antes da declaração da classe:

```kotlin
import io.gatling.javaapi.core.* 
import io.gatling.javaapi.http.* 
import io.gatling.javaapi.core.CoreDsl.* 
import io.gatling.javaapi.http.HttpDsl.*
```

Faça sua classe herdar da classe `Simulation`, até agora seu arquivo deve estar parecido com o conteúdo abaixo:

```kotlin
package com.johnowl.simulations 
 
import io.gatling.javaapi.core.* 
import io.gatling.javaapi.http.* 
import io.gatling.javaapi.core.CoreDsl.* 
import io.gatling.javaapi.http.HttpDsl.* 
 
class BasicSimulation : Simulation() { 
}
```

A partir daqui nosso artigo vai ficar muito parecido com a primeira versão que eu publiquei em [Teste de carga como código usando Gatling](/teste-de-carga-como-codigo-usando-gatling/), a diferença é que vamos usar a linguagem Kotlin ao invés de Scala. Para não duplicar os passos aqui, você pode consultar o outro artigo para entender como funciona uma simulação do Gatling. Abaixo, todo o código do teste escrito em Kotlin:

```kotlin
class BasicSimulation : Simulation() {

    private val protocol = http
        .baseUrl("http://localhost:8080")
        .contentTypeHeader("application/json")

    private val scn = scenario("Faz login e valida token gerado")
        .exec(http("Gera token com credencial válida")
            .post("/auth/v1/tokens")
            .body(ElFileBody("bodies/credentials.json"))
            .check(jsonPath("$.token").find().saveAs("token"))
        )
        .pause(Duration.ofMillis(50))
        .exec(http("Valida token")
            .post("/auth/v1/tokens/validate")
            .body(ElFileBody("bodies/token.json"))
            .check(status().`is`(200))
        )
        .pause(Duration.ofMillis(100))

    init {
        setUp(scn.injectOpen(
            nothingFor(Duration.ofSeconds(5)),
            rampUsers(3800).during(Duration.ofMinutes(1))
        )).protocols(protocol)
    }


}
```


## Gravando logs durante a execução do teste

Durante a escrita de um teste é comum precisarmos entender melhor o que está acontecendo, além de usar o debug da IDE é comum gravar logs. Para adicionar a gravação de logs em nosso teste podemos fazer o seguinte:

Adicione um logger na classe de simulação como você provavelmente já faz no seu dia a dia, veja um exemplo:

```kotlin
private val logger = LoggerFactory.getLogger(BasicSimulation::class.java)
```

Em nossa simulação, queremos gravar o token da sessão no log, para isso adiciona-se um novo passo `exec`, por padrão ele irá receber um variável com os dados da sessão, vamos chamar essa variável de `session` e ler dela o token que gravamos no passo anterior.

```kotlin
.exec { session -> 
            logger.info("token"+ session["token"]) 
            session 
        }
```

Execute novamente seu teste e você perceberá que nenhum registro de log apareceu no console. Isso acontece porque, por padrão, o Gatling seta o nível de logging para `WARN`. Como nosso log está sendo gravado como `INFO` ele não aparece. Para alterar o nível do log usado pelo Gatling você precisa adicionar a configuração abaixo no arquivo `build.gradle.kts`:

```kotlin
gatling { 
    logLevel = "INFO" 
}
```

A versão do Intellij que estou usando ficou acusando um problema nessa configuração, mas quando executei o teste via linha de comando tudo funcionou corretamente. O erro exibido na IDE foi:

```text
Cannot access 'io.gatling.gradle.JvmConfigurable.Trait.FieldHelper' which is a supertype of 'io.gatling.gradle.GatlingPluginExtension'. Check your module classpath for missing or conflicting dependencies
```

Veja como ficou nossa simulação com a gravação de logs:

```kotlin
class BasicSimulation : Simulation() {

    private val logger = LoggerFactory.getLogger(BasicSimulation::class.java)

    private val protocol = http
        .baseUrl("http://localhost:8080")
        .contentTypeHeader("application/json")

    private val scn = scenario("Faz login e valida token gerado")
        .exec(http("Gera token com credencial válida")
            .post("/auth/v1/tokens")
            .body(ElFileBody("bodies/credentials.json"))
            .check(jsonPath("$.token").find().saveAs("token"))
        )
        .pause(Duration.ofMillis(50))
        .exec { session ->
            logger.info("token"+ session["token"])
            session
        }
        .exec(http("Valida token")
            .post("/auth/v1/tokens/validate")
            .body(ElFileBody("bodies/token.json"))
            .check(status().`is`(200))
        )
        .pause(Duration.ofMillis(100))

    init {
        setUp(scn.injectOpen(
            nothingFor(Duration.ofSeconds(5)),
            rampUsers(3800).during(Duration.ofMinutes(1))
        )).protocols(protocol)
    }
}
```

Para ver todas as configurações possíveis consulte a [documentação do plugin do Gradle para Gatling](https://gatling.io/docs/gatling/reference/current/extensions/gradle_plugin/#plugin-configuration).

## Conclusão

Como vimos, a forma de usar a DSL é muito parecida com a forma que era usada com a linguagem Scala. A principal vantagem é que agora é possível ter seu código de produção e testes de performance usando a mesma linguagem de programação.

O [código fonte da aplicação usada como exemplo](https://github.com/johnowl/gatling-kotlin-dsl-example) nesse artigo pode ser encontrada no [Github](https://github.com/johnowl/gatling-kotlin-dsl-example).
