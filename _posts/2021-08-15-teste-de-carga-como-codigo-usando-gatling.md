---
layout: post
title: Teste de carga como código usando Gatling
comments: true
categories: 
    - Load test
    - Teste de carga
    - Stress test
    - Gatling
description: Cansado do JMeter? Conheça outra opção onde você escreve seus cenários de teste programando.
image: /public/images/2021-08-15/teste-de-carga.jpeg
---

## Introdução

Antes de conhecer o [Gatling](https://gatling.io/), o que é um teste de carga? É um teste cujo objetivo é entender como uma aplicação se comporta com determinada carga, geralmente usuários simultâneos, sem comprometer a experiência de uso. Um exemplo poderia ser: minha aplicação consegue responder abaixo de 700ms, com taxa de sucesso acima de 99%, ao receber um tráfego de 100 transações por segundo no fluxo de login, executando em uma EC2 (máquina virtual da AWS) com 2 processadores e 4GB de RAM?

O Gatling se auto denomina como teste de carga como código, pois você programa para construir seus testes de carga. O Gatling foi construído com a linguagem de programação Scala e uma ferramenta chamada akka. O akka é um kit de ferramentas para construção de aplicações orientadas a mensagens (message-driven) com alta concorrência, distribuídas e resilientes ele funciona com as linguagens Java e Scala. O uso dessa stack de tecnologia permite que uma única instância do Gatling abra milhares de conexões simultâneas com a aplicação sendo testada.

Nesse momento você já deve estar se perguntando: "poxa, mas eu escrevo meu código em Kotlin ou Java ou Groovy ou sua linguagem do dia a dia. Então vou ter que aprender outra linguagem?". Não precisa, você tem que aprender como funciona a DSL do Gatling, claro que um pouco de conhecimento em Scala pode facilitar o seu dia a dia, mas não é pré-requisito.

## Pré-requisitos

1. JDK 8 ou superior
2. Git
3. IntelliJ com o plugin da linguagem Scala instalado.

## Criando o projeto

Você pode criar um projeto do zero usando gradle e adicionar o plugin do Gatling ou simplesmente clonar o repositório [https://github.com/johnowl/gatling-base-project](https://github.com/johnowl/gatling-base-project) para ter um projeto base para começar. Nesse artigo eu mostro a partir do projeto base, então clone o projeto para continuar.

Analisando os arquivos e diretórios do projeto clonado:

1. **build.gradle**: arquivo de build com o pugin do Gatling
2. **src/gatling/resources**: diretório para guardar arquivos que serão usados pelos seus testes
3. **src/gatling/resources/gatling.conf**: arquivo para customizar configurações do gatling
4. **src/gatling/scala**: diretório para criar seus pacotes e adicionar os testes

## Construindo nosso teste

Crie um pacote chamado `com.johnowl` no diretório `src/scala` e adicione uma nova classe Scala dentro dele chamada `TokenValidateSimulation`. Se não aparecer a opção para adicionar uma classe Scala, crie um novo arquivo chamado `TokenValidateSimulation.scala`, a IDE deve mostrar um aviso `Setup Scala SDK`, clique nele e instale um SDK da liguagem Scala. Se tiver problemas, certifique-se de que o plugin da linguagem `Scala` foi instalado na sua IDE. Em seguida, adicione os imports abaixo do nome do pacote:

```scala
import io.gatling.core.Predef._ 
import io.gatling.http.Predef._

import scala.concurrent.duration.DurationInt
```

Faça sua classe extender a classe `Simulation`, até agora nosso arquivo está assim:

```scala
package com.johnowl

import io.gatling.core.Predef._
import io.gatling.http.Predef._

class TokenValidationSimulation extends Simulation{

}
```

Antes de continuar, precisamos entender a estrutura de um teste de carga do Gatling, ela é dividida em 3 partes:

1. Protocolo
2. Cenário
3. Setup

No **protocolo** você define algumas informações básicas da aplicação que irá receber a carga, como o endereço base e alguns headers que serão enviados em todas as requisições. Em nosso teste vamos definir a url base e o header `Content-Type`. Basta adicionar o código abaixo dentro da classe `TokenValidationSimulation`

```scala
  val protocol = http
    .baseUrl("http://localhost:8080")
    .contentTypeHeader("application/json")
```

No **cenário** você define quais o passos serão executados em seu teste. Geralmente analisa-se o comportamento de um usuário real da aplicação e o reproduz no cenário. Nosso teste consiste em chamar uma API que gera e outra que valida um token. Um passo do nosso teste tem dependência com o outro, ou seja, o token gerado o passo 1 terá que ser utilizado no passo 2.

O primeiro passo é nomear nosso cenário:

```scala
val scn = scenario("Gera e valida token de acesso")
```

Em seguida, adicionamos um passo dentro do cenário usando o método `exec`. Dentro de `exec` nomeamos o passo e configuramos a chamada HTTP.

```scala
  val scn = scenario("Gera e valida token")
    .exec(
      http("Gera token usando credencial válida")
        .post("/auth/v1/tokens")
    )
```

O próximo passo é adicionar o payload da chamada HTTP com as credenciais para gerar o token. O Gatling oferece um recurso interessante, no qual criamos um arquivo no diretório de resources e referenciamos ele em nosso teste para ser o payload da chamada HTTP. Crie um arquivo chamado `credentials.json` no diretório `src/gatling/resources/bodies`, o diretório `bodies` também precisa ser criado. Adicione o conteúdo abaixo no arquivo:

```json
{
  "client_id": "123456",
  "client_secret": "secret"
}
```

Agora precisamos adicionar esse conteúdo no corpo da requisição HTTP. Nosso cenário ficará assim:

```scala
  val scn = scenario("Gera e valida token")
    .exec(
      http("Gera token usando credencial válida")
        .post("/auth/v1/tokens")
        .body(ElFileBody("bodies/credentials.json"))
    )
```

Nesse momento precisamos gravar na sessão o token recebido na chamada HTTP para ser utilizado no próximo passo. Para isso vamos usar JSON Path, essa leitura é feita dentro do método check, ou seja, se o campo não for encontrado nosso teste irá falhar.

```scala
  val scn = scenario("Gera e valida token")
    .exec(
      http("Gera token usando credencial válida")
        .post("/auth/v1/tokens")
        .body(ElFileBody("bodies/credentials.json"))
        .check(jsonPath("$.token").find.saveAs("token"))
    )
```

Adicionamos uma pausa, para que o teste fique mais parecido com o mundo real.

```scala
  val scn = scenario("Gera e valida token")
    .exec(
      http("Gera token usando credencial válida")
        .post("/auth/v1/tokens")
        .body(ElFileBody("bodies/credentials.json"))
        .check(jsonPath("$.token").find.saveAs("token"))
    )
    .pause(300.milliseconds)
```

O passo 1 está pronto, vamos construir o segundo passo para validar o token gerado no passo anterior. No segundo passo também usamos um payload gravado no diretório `bodies`, a diferença é que ele possui uma variável que será substituída automaticamente pelo Gatling. Crie um arquivo chamado `token.json` no diretório `src/gatling/bodies` com o conteúdo:

```json
{
  "token": "${token}"
}
```

Nosso teste está assim:

```scala
  val scn = scenario("Faz login e valida token gerado")
    .exec(http("Gera token com credencial válida")
      .post("/auth/v1/tokens")
      .body(ElFileBody("bodies/login/onboarding/valid_credential.json"))
      .virtualHost("api-dev.cartaobranco.com")
      .check(jsonPath("$.token").find.saveAs("token"))
    )
    .pause(50.milliseconds)
    .exec { session =>
      logger.info("token"+ session("token").as[String])
      session
    }
    .exec(http("Valida token")
      .post("/auth/v1/tokens/validate")
      .body(ElFileBody("bodies/login/onboarding/validate_token.json"))
      .check(status.is(200))
    )
    .pause(100.milliseconds)
```

Note que adicionamos a verificação de status code no segundo passo, para considerar que o passo executou com sucesso o status code precisa ser igual a 200.

**Setup**: aqui você define a quantidade de carga que você quer no seu teste. No exemplo abaixo estamos declarando que o teste deve esperar 5 segundos para iniciar, depois disso ele vai adicionar 3800 usuários em 1 minuto, ou seja, aproximadamente 63 usuários por segundo e cada usuário irá executar o cenário definido. Multiplicando o número de usuários pela quantidade de APIs em nosso teste, teremos aproximadamente 126 requisições por segundo em nossa aplicação. Se tudo ocorrer bem, nossa aplicação irá receber 7600 chamadas em um espaço de tempo de 60 segundos, sendo que cada API vai receber 3800 chamadas. Para mais detalhes sobre as opções disponível consulte a [documentação do Gatling](https://gatling.io/docs/gatling/reference/current/general/simulation_setup/).

```scala
  setUp(scn.inject(
    nothingFor(5.seconds),
    rampUsers(3800) during 1.minutes
  )).protocols(protocol)
```

## Rodando nosso teste e analisando os resultados

O primeiro passo é ter um aplicação para ser testada e uma pergunta para ser respondida. A aplicação você pode clonar do github em <https://github.com/johnowl/gatling-load-test-app>, a pergunta que queremos responder é se nossa aplicação aguenta uma carga em 3800 usuários em um minuto ao ser executada no meu notebook.

Execute a aplicação que você acabou de clonar, ela irá iniciar na porta 8080. Em seguida, volte para o projeto Gatling, abra o terminal de linha de comando do IntelliJ e digite o comando `./gradlew clean gatlingRun`, esse comando irá compilar o projeto e rodar todas as simulações existentes nele. Quando terminar, você verá algo assim no terminal:

```text
---- Gera e valida token -------------------------------------------------------
[##########################################################################]100%
          waiting: 0      / active: 0      / done: 3800  
================================================================================

Simulation com.johnowl.TokenValidationSimulation completed in 65 seconds
Parsing log file(s)...
Parsing log file(s) done
Generating reports...

================================================================================
---- Global Information --------------------------------------------------------
> request count                                       7600 (OK=7600   KO=0     )
> min response time                                      0 (OK=0      KO=-     )
> max response time                                   1705 (OK=1705   KO=-     )
> mean response time                                    15 (OK=15     KO=-     )
> std deviation                                        121 (OK=121    KO=-     )
> response time 50th percentile                          1 (OK=1      KO=-     )
> response time 75th percentile                          1 (OK=1      KO=-     )
> response time 95th percentile                          3 (OK=3      KO=-     )
> response time 99th percentile                        561 (OK=561    KO=-     )
> mean requests/sec                                 124.59 (OK=124.59 KO=-     )
---- Response Time Distribution ------------------------------------------------
> t < 800 ms                                          7538 ( 99%)
> 800 ms < t < 1200 ms                                  26 (  0%)
> t > 1200 ms                                           36 (  0%)
> failed                                                 0 (  0%)
================================================================================

```

Esse é um relatório básico dos testes executados, para ver um relatório mais completo, abra o arquivo `build/reports/gatling/index.html` no seu navegador. Você verá um relatório com vários gráficos, um deles é esse, que dá uma visão geral do teste:

![Relatório do Gatling]({{site.baseurl}}/public/images/2021-08-15/relatorio-gatling.png)

Para ver o relatório completo acesse: [relatório completo do Gatling]({{site.baseurl}}/public/images/2021-08-15/gatling/index.html).

## Obrigado

Agora você sabe como executar testes de carga usando o Gatling para ver como sua aplicação se comporta com determinada carga.
