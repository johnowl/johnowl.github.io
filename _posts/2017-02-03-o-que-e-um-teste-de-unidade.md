---
layout: post
title: O que é um teste de unidade
comments: true
categories: 
    - Testes de unidade
---

Não encontrei uma definição formal do que é um teste de unidade, talvez porque eu não tenha procurado direito. Mas vamos explicar de forma resumida o que você precisa saber.

Teste de unidade, também conhecido como teste unitário, é um teste de caixa branca. Isso significa que temos acesso ao código fonte da aplicação que está sendo testada. Também existem os testes de caixa preta, que geralmente são feitos testando a interface de uma aplicação, sem saber como ela funciona internamente. Esse tipo de teste também é conhecido como teste funcional.

Uma unidade é a menor parte do nosso software, em linguagens orientadas a objetos como Java e C# a menor parte é a classe. Geralmente as classes possuem comportamentos, que são codificados dentro de métodos.

Um teste de unidade pode ser feito de forma manual ou automática, sempre prefira a forma automática (se possível) pois seu teste ficará guardado junto com o código da sua aplicação. Ele serve como uma ótima documentação dos métodos do seu sistema. Outra grande vantagem é que no futuro, quando sua aplicação estiver muito grande, ele pode ajudar a rastrear possíveis bugs causados por alguma alteração em qualquer parte do seu código.

Sabendo disso, podemos dizer que teste de unidade é um teste feito para validar o comportamento de uma unidade de software. Ou seja, um teste de unidade valida se ao invocar um método de uma classe com determinados parâmetros ele retorna o resultado esperado.