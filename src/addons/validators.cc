#include <node.h>
#include <iostream>
#include <string>
#include <regex>

using namespace v8;
using namespace std;

void ValidatePassword(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    if (args.Length() < 1 || !args[0]->IsString()) {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "Argument must be a string").ToLocalChecked()));
        return;
    }

    String::Utf8Value password(isolate, args[0]->ToString(isolate->GetCurrentContext()).ToLocalChecked());
    string passwordStr(*password);

    // Перевірка довжини пароля
    if (passwordStr.length() < 6 || passwordStr.length() > 24) {
        args.GetReturnValue().Set(Boolean::New(isolate, false));
        return;
    }

    // Перевірка на великі літери, малі літери та цифри
    if (!std::regex_search(passwordStr, std::regex("[A-Z]")) ||
        !std::regex_search(passwordStr, std::regex("[a-z]")) ||
        !std::regex_search(passwordStr, std::regex("[0-9]"))) {
        args.GetReturnValue().Set(Boolean::New(isolate, false));
        return;
    }

    // Пароль успішно пройшов всі перевірки
    args.GetReturnValue().Set(Boolean::New(isolate, true));
}

void ValidateEmail(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    if (args.Length() < 1 || !args[0]->IsString()) {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "Argument must be a string").ToLocalChecked()));
        return;
    }

    String::Utf8Value email(isolate, args[0]->ToString(isolate->GetCurrentContext()).ToLocalChecked());
    string emailStr(*email);

    // Перевірка за допомогою регулярного виразу
    std::regex emailRegex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
    bool isValid = std::regex_match(emailStr, emailRegex);

    args.GetReturnValue().Set(Boolean::New(isolate, isValid));
}

void ValidateUsername(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    if (args.Length() < 1 || !args[0]->IsString()) {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "Argument must be a string").ToLocalChecked()));
        return;
    }

    String::Utf8Value name(isolate, args[0]->ToString(isolate->GetCurrentContext()).ToLocalChecked());
    string nameStr(*name);

    // Перевірка довжини імені
    if (nameStr.length() < 2 || nameStr.length() > 20) {
        args.GetReturnValue().Set(Boolean::New(isolate, false));
        return;
    }

    // Імʼя успішно пройшло всі перевірки
    args.GetReturnValue().Set(Boolean::New(isolate, true));
}



void Initialize(Local<Object> exports) {
    NODE_SET_METHOD(exports, "validatePassword", ValidatePassword);
    NODE_SET_METHOD(exports, "validateEmail", ValidateEmail);
    NODE_SET_METHOD(exports, "validateUsername", ValidateUsername);
}

NODE_MODULE(addon, Initialize);
