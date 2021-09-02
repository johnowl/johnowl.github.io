---
layout: post
title: Kotlin no backend. O Java vai morrer?
comments: true
categories: 
    - Java
    - Kotlin
    - Backend
description: Conheça a linguagem Kotlin e como usá-la no backend.
image: /public/images/2021-09-02/tunel.jpg
---

## Introdução

Se você só quer saber se o Java vai morrer, eu conto isso na conclusão, pode pular direto pra lá. Se quiser entender um pouco mais sobre Kotlin, continue lendo.

## O que é Kotlin?

Kotlin é uma linguagem moderna, estaticamente tipada e que pode ser compilada para byte codes da JVM, Javascript e código nativo usando LLVM. Nosso foco neste artigo é a compilação usando a JVM.

## Por que a linguagem Kotlin foi criada?

A linguagem foi criada pela JetBrains para ser usada no desenvolvimento da Intellij IDEA, simplesmente porque o time queria uma linguagem melhor que Java. O objetivo era deixar a base de código da IDE mais simples. Como a ideia não era jogar todo o código Java fora e começar do zero, Kotlin nasceu e ainda é compatível com Java, sendo possível misturar código Java e Kotlin no mesmo projeto.

## Um pouco de história

Em 2010 a JetBrains iniciou o desenvolvimento da linguagem e seis anos depois a versão 1.0 foi lançada. No Google IO de 2017 o Google anunciou que o desenvolvimento Android iria suportar Kotlin como linguagem oficial. Um dos motivos da Google ter partido para adoção do Kotlin é ter sido processada pela Oracle por quebra de patentes no uso do Java.

A linguagem Java é bem mais antiga, começou a ser criada em 1991 na Sun Microsystems e a versão 1.0 foi lançada em 1995. No ano de 2009 a Oracle comprou a Sun Microsystems por 7 bilhões de dólares e junto com a empresa todos os seus produtos, incluindo o Java.

O Java já nasceu com o objetivo de rodar em qualquer plataforma, independente do sistema operacional. Há alguns anos, o instalador do Java mostrava uma mensagem de que Java rodava em alguns bilhões de dispositivos. Isso foi possível por causa da construção da JVM, um emulador capaz de rodar Byte Codes em qualquer dispositivo. Os Byte Codes são um formato intermediário que o código Java ou Kotlin é transformado antes de ser compilado para código nativo pela JVM na plataforma que está executando.

## Curiosidade: A origem dos nomes

O primeiro nome da linguagem Java foi Oak (Carvalho), mas os criadores tiveram que escolher outro nome porque Oak já era utilizado por outra empresa. Dizem que a sugestão do nome veio por causa de um café, chamado Peet's Java. Java provavelmente é o local de origem do café, uma ilha que fica na Indonésia.

Kotlin também é um ilha, fica em São Petersburgo, no Golfo da Finlândia. Foi escolhido por ser o nome de uma ilha, assim como Java.

## Compatibilidade do Kotlin com ferramentas do mundo Java

Kotlin é compatível com a linguagem Java, sendo possível misturar as duas linguagens em um mesmo projeto. Além disso, a maioria das ferramentas que as pessoas que programam em Java já conhecem também funcionam com a linguagem Kotlin.

Os frameworks Spring e Micronaut oferecem suporte oficial à linguagem Kotlin.

Gradle, além de permitir a escrita de scritps de build usando Groovy, também dá suporte à Kotlin. Se você não gosta de Gradle, também existem um plugin de Kotlin para o Maven.

Ferramentas de testes comuns para pessoas desenvolvedoras Java como JUnit e Mockito também são compatíveis com Kotlin. Para mockito até existe uma dependência chamada Mockito Kotlin que adiciona algumas funções auxiliares para escrita de mocks aproveitando alguns recursos da linguagem Kotlin. 

Ainda falando de testes, a ferramenta Jacoco, usada para analisar a cobertura de testes também é compatível com Kotlin.

## Features interessantes do Kotlin

Abaixo destaquei algumas features interessantes da linguagem Kotlin, sempre que possível cito algum recurso do Java que é parecido.

### Inferência de tipos, val e var

Em Kotlin `val` é usado para criar variáveis imutáveis e `var` é usado para criar variáveis mutáveis. Parâmetros de funções são imutáveis por padrão, ou seja, você não pode alterar o valor de um parâmetro recebido em uma função.

O compilador do Kotlin é inteligente o suficiente para fazer inferência dos tipos sempre que possível, isso reduz a verbosidade do código.

```kotlin
val name = "John" // (1)
val price = 1.45 // (2)
val itens = 42 // (3)

fun findUser(id: Long): User {
    return User(id, "John")
}

val user = findUser(123) // (4)
```

1. Ao atribuir uma `String` na declaração de uma variável, ela será do tipo `String`
2. Ao atribuir um número com casa decimal, ela será do tipo `Double`
3. Ao atribuir um número sem casa decimal, ela será do tipo `Int`
4. A função `findUser` retorna uma instância de `User` e o compilador consegue fazer a inferência do tipo.

A partir do Java 10, foi adicionado o recurso de inferência de tipos para variáveis locais.

### Kotlin null safety

Em Java todos os objetos podem ser nulos. Kotlin possui um recurso na linguagem que te dá a opção de escolher se um objeto pode ou não ser nulo. Se você já programou em C# vai achar a forma de declarar um valor nullable muito familiar. Basta adicionar o ponto de interrogação depois do tipo para torná-lo nullable.

Exemplo:

```kotlin
val user: User? = null
val name: String? = null
```

Caso você precise trabalhar com valores que podem ser nulos, a linguagem oferece alguns recursos. Um deles é o Elvis Operator `?:` que facilita o trabalho com nulos.

```kotlin
fun greeting(name: String?): String {
    
    name ?: return "Olá pessoa!"

    return "Olá ${name.toupper()}"
}
```

Após o uso do Elvis Operator, não é mais preciso checar se o valor é nulo, pois o compilador entende que isso já foi verificado. Além do Elvis Operator, você pode usar o sinal de interrogação para chamar uma função ou propriedade em uma instância de uma classe somente se ela não for nula:

```kotlin
val name = user?.name
```

Isso evita o estouro de uma NullPointerException, é o mesmo que:

```kotlin
    val name = if (user == null) { 
        null 
    } else { 
        user.name
    }
````

## Kotlin Data Class

Quantas vezes você já precisou criar um objeto somente para levar dados de um lado para o outro? As data classes tornam isso mais fácil. Ao definir uma classe como `data class` ela terá alguns métodos prontos: `equals()`, `hashcode()`, `copy()`, `toString()`. Você pode escolher se os valores são mutáveis ou imutáveis, em Kotlin, sempre devemos dar preferência para valores imutáveis.

Exemplo:

```kotlin
data class User(
    val name: String,
    val country: String
)
```

É possível desestruturar uma `data class` em variáveis de uma forma simples:

```kotlin
val user = User("John", "Brazil")
val (name, country) = user

println(name)
println(country)
```

E se precisar alterar algum valor imutável, basta criar um cópia da data class substituindo o valor desejado:

```kotlin
val userUpdated = user.copy(country = "Netherlands")
```

No Java 14 foi adicionado um recurso parecido com as `data classes` chamado record. Para ver as diferenças, leia o artigo "[A diferença entre o Records do Java, o @Data do Lombok e Classe Data do Kotlin](https://deviniciative.wordpress.com/2021/08/30/a-diferenca-entre-o-records-do-java-o-data-do-lombok-e-classe-data-do-kotlin/)" no blog do Sergio Lopes (Zé Lopes).

### Properties

Em Java podemos usar recursos na IDE ou o projeto Lombok para não ter que ficar escrevendo getters e setters. A linguagem Kotlin oferece um recurso para a construção de propriedades que eu também já vi em C#. Veja um exemplo:

```kotlin
class Cart {

    private val size = 0
    val isEmpty: Boolean
        get() = this.size == 0 // (1)
    
    var counter = 0
        set(value) { // (2)
            if (value >= 0)
                field = value
        }

    private var _total = 0 // (3)
    var total: Int // (4)
        set(value) { _total = value } 
        get() = _total
}

fun main() {
    val cart = Cart()
    println(cart.isEmpty) // (5)
    
    cart.counter = 10 // (6)
    println(cart.counter)    
}
```

1. Exemplo de uma propriedade baseada em informação de outra variável
2. Exemplo de uma propriedade com validação do dado de entrada
3. Campo privado para guardar o valor da propriedade total
4. Propriedade total com getter e setter
5. Exemplo de leitura do valor de uma propriedade
6. Exemplo de atribuição de valor em uma propriedade

Além de definir as propriedades no corpo da classe, é possível defini-los no construtor:

```kotlin
class Product(
    val id: Long, // (1)
    var name: String, // (2)
    private val price: BigDecimal // (3)
)
```

1. A propriedade id foi declarada como `val` no construror da classe, então ele terá somente um `getter` e será imutável.
2. A propriedade name foi declarada como `var`, então ela terá um `getter` e um `setter` sendo possível alterá-la.
3. A propriedade price foi declarada como `private val`, então ela é imutável e só pode ser acessada de dentro da classe Product.

## Smart cast

Se você checar o tipo de uma variável, na linha seguinte a variável já vai ser do tipo verificado:

```kotlin
interface Person

class Driver : Person {
    fun working() = true
}

class Rider : Person {
    fun rating() = 5
}

fun main() {
    val person: Person = Driver()
    if (person is Driver) {
        println(person.working()) // (1)
    }
}
```

1. Posso usar o método working da classe driver pois na linha anterior eu verifiquei se a variável `person` é do tipo `Driver`.

### Single-expression function

Quantas vezes você já construiu funções de uma linha? Com Kotlin você pode simplificar a construção omitindo o tipo de retorno e as chaves:

```kotlin
fun isOdd(number: Int) = number % 2 == 0
```

### Coroutine

Kotlin Coroutines são como threads, só que muito mais leves. É possível criar um número muito maior de coroutines do que de threads. Veja esse exemplo extraído do site da linguagem Kotlin que executa 100.000 coroutines em apenas 5 segundos:

```kotlin
fun main() = runBlocking {
    repeat(100_000) { // launch a lot of coroutines
        launch {
            delay(5000L)
            print(".")
        }
    }
}
```

A linguagem Java usa as threads do sistema operacional, que são muito mais pesadas e limitadas quando comparadas as coroutines. Além disso, com coroutines, mesmo usando um processamento em multithread e não bloqueante, seu código ainda é executado de maneira sequencial, sem precisar criar subscribers ou callbacks.

```kotlin
suspend fun doSomethingHeavy() {
  println("do work")
}

suspend fun main() {
  doSomethingHeavy()
  println("finished")
}
```

O resultado da execução será

```text
do work
finished
```

A linguagem Java possui o projeto Loom, que está criando as threads virtuais para a JVM, a ideia é que elas sejam mais performáticas que as threads atuais do Java.

### Multiline string

A linguagem Kotlin tem um recurso para escrever strings com várias linhas, basta colocar o texto entre 3 aspas duplas.

```kotlin
val template = """
Olá [Nome]! Seja bem vindo a [Empresa]

Obrigado

[Assinatura'
"""
```

### Extension function

Esse é outro recurso familiar para quem já trabalhou com a linguagem C#. As extension functions permitem adicionar métodos em objetos sem precisar ter acesso ao código da classe. Isso pode ajudar a deixar seu código mais expressivo. Veja um exemplo:

```kotlin
fun String.isCep() = Regex("^[0-9]{8}$").matches(this)

fun main() {
    val value = "09876587"
    println(value.isCep())
}
```

### Named arguments

Imagine que você tem uma função que recebe três `String` como parâmetros. Para deixar seu código mais claro, você pode nomear os argumentos na chamada da função. Isso permite também que você use-os fora da ordem em que foram declarados.

```kotlin
fun doSomething(name: String, city: String, state: String) {
    // do work
}

fun main() {
    doSomething(state = "SP", city = "Jundiaí", name = "John")
}
```

### Interpolação de Strings

Para criar uma `String` usando valores de variáveis é muito simples em Kotlin. Basta adicionar a variável dentro da `String` usando o `$` como prefixo. Se precisar ler uma propriedade ou chamar uma função, além do `$` é preciso deixar a variável entre chaves.

```kotlin
fun main() {
    val name = "John"    
    println("My name is $name, in uppercase is ${name.uppercase()}")
}
```

### Blocos if/else e try/catch retornam valores

Isso deixa seu código mais simples, a última linha de cada bloco (`if`, `else`, `try`, `catch`) serão retornados:

```kotlin
fun main() {
    val isToday = true
    val message = if (isToday) {
        "Is today!"
    } else {
        "It is not today =/"
    }
    println(message)

    val number: Int? = try { parseInt(input) } catch (e: NumberFormatException) { null }
    println(number)
}
```

### Ranges e Progressions

Ranges (intervalos) e progressions (progressões) são formas de escrever loops de maneira mais simples e expressiva.

```kotlin
if (i in 1..4) {  
    print(i)
}
```

O intervalo `1..4` no código acima é o mesmo que escrever `1 <= i && i <= 4`. Para inverter a ordem, usa-se o operador `downTo`:

```kotlin
for (i in 4 downTo 1) {
    print(i)
}
```

Além disso, é possível usar o operador step caso não queira evoluir de 1 em 1.  O exemplo abaixo vai imprimir o valor `1357`

```kotlin
for (i in 1..8 step 2) print(i)
```

## Nomes de funções podem ser frases

Esse recurso é muito interessante para a escrita de testes de unidade. Veja um exemplo que retirei do site do Spring Framework:

```kotlin
@Test
fun `Assert blog page title, content and status code`() { // (1)
    println(">> Assert blog page title, content and status code")
    val entity = restTemplate.getForEntity<String>("/")
    assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
    assertThat(entity.body).contains("<h1>Blog</h1>")
}
```

1. Posso usar espaços, ponto, vírgula, etc no nome da função. Isso deixa meu teste mais fácil de ler.

## Conclusão

Respondendo à pergunta do título desse post, não, o Java não vai morrer. A concorrência com o Kotlin e outras linguagens está fazendo bem para o Java, basta olhar para a evolução acelerada do Java com novos recursos sendo adicionados, inclusive alguns muito parecidos com recursos da linguagem Kotlin.

Um dos grandes aceleradores do crescimento da adoção da linguagem Kotlin foi o Google a ter escolhido como linguagem oficial para desenvolvimento de aplicações Android. Isso aconteceu em 2017 e a decisão foi tomada após a Oracle processar a Google, acusando-a de quebra de patente ao usar trechos de código do Java no Android. Além disso, a linguagem tem o seu mérito. A JetBrains conseguiu criar uma linguagem concisa e que pode reduzir a carga cognitiva das pessoas desenvolvedoras em seu dia a dia. Além disso, eu enxergo a linguagem Kotlin como um compilado de coisas interessantes de outras linguagens.

Vale a pena aprender Kotlin? Com certeza! E para quem já trabalha com Java a curva de aprendizado tende a ser pequena pois as ferramentas são as mesmas. No Brasil e no mundo temos grandes empresas usando Kotlin para desenvolvimento backend em conjunto com os frameworks Spring, Micronaut e Ktor. Exemplos: C6 Bank, Ifood, Itaú, Mercado Livre, Google, JetBrains, Zup, Zalando, entre muitas outras.
