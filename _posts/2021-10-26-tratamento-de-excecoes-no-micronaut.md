---
layout: post
title: Tratamento de exceções no Micronaut
comments: true
categories: 
    - Micronaut
    - Exception
    - Error Handling
    - Microservice
description: Como fazer tratamento de exceptions no Micronaut e alterar o formato das respostas de erro para ficar de acordo com o guia de estilos de API da sua empresa.
image: /public/images/2021-10-26/sorvete.jpg
---

## Introdução

Muitas vezes temos que seguir um style guide que define como nossas APIs devem devolver suas respostas, incluindo as respostas de erro. E a forma que o style guide define as mensagens de erro pode ser diferente do padrão adotado pelo Micronaut. Como garantir que todas as mensagens de erro seguem um padrão diferente do que existe no framework?

Além disso, exibir mensagens de erros detalhadas pode trazer problemas de segurança. Para evitar esse tipo de problema é recomendado retornar uma mensagem de erro com poucos detalhes e gravar nos logs as informações mais detalhadas.

## Tratando erros locais e globais usando a anotação `@Error`

Para tratar exceções no Micronaut usa-se a anotação `@Error` em um método dentro de um `Controller`, o método deve retornar uma resposta de erro. Esse tipo de tratamento pode ser feito de forma pontual para funcionar em um único `Controller` ou de forma global. Veja o exemplo abaixo de como fazer isso de forma localizada:

```kotlin
data class ApiError(
 val code: String,
 val message: String
)

@Controller
class HelloController {
 @Get("/hello")
 fun hello(): Nothing = throw UserNotFoundException()

 @Error(exception = UserNotFoundException::class)
 fun error(): HttpResponse<ApiError> {
  return HttpResponse.badRequest(ApiError("user_not_found", "User not found."))
 }
}
```

Caso a mesma exceção seja lançada em outro `Controller`, o tratamento padrão do Micronaut que retorna um erro 500 será aplicado. Para que esse tratamento de erro se torne global, é preciso setar a propriedade global com o valor true. Também é interessante centralizar isso em um controller para facilitar o entendimento.

```kotlin
@Controller
class GlobalErrorController {

 @Error(global = true, exception = UserNotFoundException::class)
 fun error(): HttpResponse<ApiError> {
  return HttpResponse.badRequest(ApiError("user_not_found", "User not found."))
 }
}
```

Agora, qualquer parte da sua aplicação que lançar uma exceção do tipo `UserNotFoundException` que não seja tratada, irá retornar a mensgem de erro definida no trecho de código acima. A resposta será a seguinte com o código HTTP 400:

```json
{
   "code": "user_not_found",
   "message": "User not found"
}
```

## Detalhando o tratamento de exceções no Micronaut

Além da anotação `@Error`, existem duas interfaces muito importantes no Micronaut quando estamos falando de tratamento de exceções:

1. `ErrorResponseProcessor<T>`
2. `ExceptionHandler<T extends Throwable, R>`

A primeira interface define como as mensagens de erro serão retornadas, o tipo do retorno é definido pelo tipo T. Na versão 3.1.1 do Micronaut a implementação padrão é feita pela classe `HateoasErrorResponseProcessor`. Essa classe retorna as mensagens de erro em formato JSON seguindo o padrão HATEOAS. Veja um exemplo:

```json
{
    "message": "Internal Server Error",
    "_links": {
        "self": {
            "href": "/v1/users",
            "templated": false
        }
    },
    "_embedded": {
        "errors": [{
            "message": "Internal Server Error: Invalid user"
        }]
    }
}
```

Já a segunda interface listada acima, `ExceptionHandler`, é criada para cada tipo de exceção que queremos tratar. O tipo T é a exceção que será tratada e R é o tipo que será retornado. O Micronaut possui várias implementações dessa interface para diferentes tipos de exceção:

* ContentLengthExceededHandler
* ConversionErrorHandler
* DuplicateRouteHandler
* HttpStatusHandler
* JsonExceptionHandler
* UnsatisfiedArgumentHandler
* UnsatisfiedRouteHandler
* URISyntaxHandler
* ConstraintExceptionHandler

Todas essas implementações criam uma instância de `ErrorContext` com informações detalhadas sobre o erro e também criam um `HttpResponse` com o status code que deve ser retornado.

Depois de criar o contexto e a resposta HTTP essas classes invocam o método `processResponse` da implementação da interface `ErrorResponseProcessor<T>`, que é responsável por montar a resposta que será retornada para o consumidor da API.

## Como alterar de forma global o formato de todas as exceções não tratadas?

Para garantir que todas as exceções não tratadas sejam gravadas nos logs e não vazem informações sensíveis podemos criar uma implementação customizada do bean `ErrorResponseProcessor`. Em nosso exemplos vamos usar o formato abaixo para padronizar todas as mensagens de erro:

```json
{
   "code": "user_not_found",
   "message": "User 123 was not found."
}
```

O campo `code` possui um código composto somente por letras minúsculas, números e o sublinhado e serve para identificar o erro. O campo `message` possui uma descrição do erro. Agora vamos para nosso implementação customizada do `ErrorResponseProcessor<T>`:

```kotlin
@Singleton
@Replaces(HateoasErrorResponseProcessor::class)
class CustomErrorResponseProcessor : ErrorResponseProcessor<ApiError> {
 override fun processResponse(
  errorContext: ErrorContext,
  response: MutableHttpResponse<*>
 ): MutableHttpResponse<ApiError> {

  val errors = errorContext.errors.joinToString { it.message }
  val rootCause: Throwable? = if (errorContext.rootCause.isPresent) errorContext.rootCause.get() else null
  log.error("CustomErrorResponseProcessor->$errors", rootCause)

  return if (response.code() in 400..499) {
   HttpResponse.serverError(ApiError("bad_request", errors))
    .contentType(MediaType.APPLICATION_JSON_TYPE)
    .status(response.status)
  } else {
   val internalServerError = ApiError("internal_error", "Internal server error.")
   HttpResponse.serverError(internalServerError)
    .contentType(MediaType.APPLICATION_JSON_TYPE)
    .status(HttpStatus.INTERNAL_SERVER_ERROR)
  }
 }

 companion object {
  private val log = LoggerFactory.getLogger(CustomErrorResponseProcessor::class.java)
 }
}
```

Após fazer isso, todas as exceções não tratadas que não são erros da família 400 terão o retorno abaixo com o status code 500. Para garantir que nenhum header adicional vaze por acidente, ao invés de repassar o response recebido, foi criado outro response somente com as informações que deverão ser enviadas para o consumidor da API.

```kotlin
{
   "code": "internal_error",
   "message": "Internal error"
}
```

## Como personalizar os erros gerados por validações de beans?

Quando usamos a implementação da Bean Validation construída pelo Micronaut precisamos anotar a classe que será validada com `@Introspected` e usar a anotação `@field:` se estivermos trabalhando com data classes, veja um exemplo abaixo:

```kotlin
@Introspected
data class User(
 @field:NotBlank @field:NotNull @field:Size(min = 3, max = 255) val name: String?,
 @field:NotBlank @field:NotNull val email: String?
)
```

Além disso, se estivermos trabalhando com Kotlin, para não ter que adicionar o modificador `open` tanto na classe quanto método que possui o parâmetro que será validado, precisamos adicionar a anotação `@Validated` na classe além da anotação `@Valid` no método que possui o parâmetro que será validado.

```kotlin
@Controller
@Validated
class UserController {
 @Post("/users")
 fun addUser(@Valid user: User) = user
}
```

O formato de erro do Micronaut quando faz a validação de um bean não atende o style guide de APIs da minha empresa, como alterar a resposta de erro?

A exceção lançada pela Bean Validator é do tipo `ConstraintViolationException`. Sabendo disso, uma possibilidade para alterar o formato da resposta de erro é substituir o bean `ConstraintExceptionHandler`, que é responsável pelo tratameto dessa exceção. Além disso, poderíamos criar um `ErrorContext` e um `HttpResponse` e chamar o método `processResponse` da implementação da interface `ErrorResponseProcessor`. Para simplificar nosso exemplo, vamos retornar o erro formatado diretamente da nossa classe `ExceptionHandler`. A resposta de erro esperado é algo parecido com o exemplo abaixo:

```json
{
    "code": "bad_request",
    "message": "Bad request",
    "fields": [
        {
            "field": "user.email",
            "message": "must not be blank"
        },
        {
            "field": "user.name",
            "message": "size must be between 3 and 255"
        },
        {
            "field": "user.name",
            "message": "must not be blank"
        }
    ]
}
```

Veja como ficou nossa implementação:

```kotlin
@Singleton
@Replaces(ConstraintExceptionHandler::class)
class CustomConstraintExceptionHandler : ExceptionHandler<ConstraintViolationException, HttpResponse<*>> {
 override fun handle(request: HttpRequest<*>, exception: ConstraintViolationException): HttpResponse<*> {

  val validationErrors = ApiError(
   code = "bad_request",
   message = "Bad request",
   fields = exception
    .constraintViolations
    .map { e ->
     FieldError(e.propertyPath.drop(1).joinToString(separator = "."), e.message)
    }
  )

  return HttpResponse.badRequest(validationErrors)
   .contentType(MediaType.APPLICATION_JSON_TYPE)
 }
}
```

Nossa classe ficou bem simples, ela apenas lê todas as violações de regras da propriedade `exception.constraintViolations` e faz o mapeamento do caminho da propriedade com sua respectiva mensagem de erro.

## Conclusão

O Micronaut Framework é muito flexível e oferece diversas opções para tratamento de exceções. Vimos que é possível fazer o tratamento de forma localizada ou de forma global. Além disso, conseguimos customizar as mensagens de erros de forma simples, dessa forma é possível seguir o guia de estilos de API da sua empresa ao invés de ser obrigado a adotar o padrão do framework.

<!-- Photo by <a href="https://unsplash.com/@rojekilian?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Sarah Kilian</a> on <a href="https://unsplash.com/s/photos/error?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
   -->
