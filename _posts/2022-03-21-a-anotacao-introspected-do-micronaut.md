---
layout: post
title: A anotação @Introspected do Micronaut
comments: true
categories: 
    - Introspected
    - Micronaut
    - Reflection
description: Entenda como funciona a introspecção do Micronaut e qual a diferença entre a versão do Java chamada de Reflection.
image: /public/images/2022-03-21/reflection-small.jpg
---

## Introdução

A linguagem Java tem um recurso muito poderoso chamado Reflection. Com o uso de Reflection é possível listar propriedades de uma classe, consultar e alterar valores de propriedades, invocar métodos, tudo feito programaticamente. Esse processo também é connhecido como introspecção. 

Esse recurso é muito usado por IDEs, frameworks como o Spring, frameworks de teste como Junit. Tudo acontece em tempo de execução ou runtime.

O Micronaut, desde a versão 1.1, lançou um substituto para a Reflection do Java, a diferença é que ele funciona em tempo de compilação e não em tempo de execução. Algumas vantagens são que sua aplicação inicia mais rápido e usa menos memória pois o trabalho já foi feito em tempo de compilação.

## Como deixar um bean disponível para introspecção no Micronaut

Usando a Reflection do Java, qualquer classe está disponível para introspecção, com Micronaut você precisa informar qual bean está disponível.

O jeito mais simples de deixar um bean disponível para introspecção no Micronaut é usando a anotação @Introspected. Veja um exemplo:

```kotlin
import io.micronaut.core.annotation.Introspected

@Introspected 
class Animal( 
	val name: String, 
	var city: String 
)
```

Se o bean faz parte de alguma dependência e você não tem acesso ao código fonte para adicionar a anotação `@Introspected`, não se preocupe. Micronaut oferece uma solução para isso. Basta criar uma classe de configuração e anotá-la com `@Introspected` informando quais beans precisam de introspecção. Veja abaixo:

```kotlin
import io.micronaut.core.annotation.Introspected  
  
@Introspected(classes = [Person::class])  
class PersonConfiguration
```

## Exemplo de introspecção com Micronaut

Veja abaixo um exemplo de uso da introspeção em tempo de compilação do Micronaut. Abaixo temos três exemplos:

1. Como instanciar uma classe
2. Como alterar o valor de uma propriedade
3. Como invocar um método, note que precisamos usar a anotação `@Executable` no método para que a introspecção encontre o método.

```kotlin
fun main(args: Array<String>) { 
 
	val introspection = BeanIntrospection.getIntrospection(Animal::class.java) 
 
	// creating a new instance 
	val brie: Animal = introspection.instantiate("Brie", "Jundiaí") 
	println("The animal's name is ${brie.name} and he lives in ${brie.city}") 
 
	// setting a property 
	val cityProperty: BeanProperty<Animal, String> = introspection.getRequiredProperty("city", String::class.java) 
	cityProperty.set(brie, "Eindhoven") 
	println("Now he lives in ${brie.city}") 
 
	// invoking a method 
	val walkMethod = introspection.beanMethods.find { it.name == "walk" } ?: throw Exception("Method not found") 
	walkMethod.invoke(brie) 
 
 
} 
 
@Introspected 
class Animal( 
	val name: String, 
	var city: String 
) { 
 
	@Executable // it's needed to introspection find this method 
	fun walk() { 
		println("Walking") 
	} 
}

```

## Serialização Json no Micronaut com Jackson

O time do Micronaut fez um trabalho para que Jackson funcione com a introspecção do Micronaut, ou seja, a reflection do Java não é usada nesse contexto. 

Essa funcionalidade está habilitada por padrão e você só precisa anotar sua classe com `@Introspected` para que isso funcione corretamete.

## Conclusão

A instrospecção do Micronaut melhora a performance da sua aplicação reduzindo o tempo de início e o uso de memória. Além disso, ela é compatível com a compilação nativa da GraalVM e problemas podem ser identificados em tempo de compilação.

Uma desvantagem é que, por tudo ocorrer em tempo de compilação, você tem menos flexibilidade em tempo de execução. Para dar um exemplo mais claro, imagine que você está usando o Micronaut Data, compilou sua aplicação para usar o banco H2 para rodar seus testes mas em produção você quer usar Postgres. Como as queries são criadas em tempo de compilação, você precisa compilar sua aplicação novamente.