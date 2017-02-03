---
layout: post
title: Características de um bom teste de unidade
comments: true
---

Um bom teste de unidade deve possuir, pelo menos, as 8 características que seguem.

1. **Automatizado**: um bom teste não precisa de interferência humana para funcionar, no máximo você clica em um botão na sua IDE favorita e os testes são executados. Você recebe o feedback se executaram com sucesso ou falharam. Ao usar testes de unidade automatizados facilitamos a cultura de DevOps, pois dessa forma é possível executar todos os testes da aplicação durante a integração contínua.

2. **Rápido**: testes de unidade executam muito rápido, cada teste geralmente leva poucos milissegundos.

3. **Desacoplado**: testes de unidade não dependem de recursos externos como banco de dados, webservices ou outros sistemas. Esse é um dos motivos por executarem tão rapidamente. Caso exista alguma dependência podemos usar técnicas para substituí-la por um dublê.

4. **Independente**: um teste de unidade não deve depender de outros testes. Deve ser possível executar um único teste em uma bateria com vários testes ou executá-los em qualquer ordem.

5. **Um teste por cenário**: cada teste deve ter uma única responsabilidade, ou seja, cada teste deve ser responsável pela validação de um único cenário e deve testar uma única unidade do seu software. Por exemplo, em um método que soma dois números, você pode ter os cenários "Somar inteiros positivos" e "Somar inteiros negativos", cada cenário terá um teste diferente.

6. **Legível**: um teste deve ser fácil de ler. O nome do teste deve dizer exatamente o que ele faz, não se preocupe se ele ficar muito grande, ele deve ser claro. Teste também é código, então devemos ter o mesmo cuidado que temos com o código de produção. Devemos evitar repetição e reaproveitar código sempre que possível. A maioria dos framework a de testes de unidade possuem recursos para ajudar o reaproveitamento de código.

7. **Manutenível**: um teste deve ser fácil de manter. Cada teste está acoplado a uma unidade do seu código de produção, geralmente mudanças no código vão gerar mudanças nos testes. Então precisamos escrever testes com código de qualidade.

8. **Consistente**: um teste de unidade deve retornar sempre o mesmo resultado, não importa quantas vezes ele seja executado.

