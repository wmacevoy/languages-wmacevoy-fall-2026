# CMake is the portable layer: the same three commands (configure, build, test)
# drive GCC, Clang and MSVC, so the CI matrix runs one recipe on six platforms
# rather than three compiler-specific ones.
#
# 3.16 is the floor because that is what Debian bookworm ships (the container),
# and it is comfortably above the 3.5 minimum CMake 4.x still accepts (the
# Windows runners ship CMake 4.x).
cmake_minimum_required(VERSION 3.16)

project(hello
    VERSION 1.0.0
    DESCRIPTION "The standard C++ hello world, built everywhere"
    LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
# Off, so the build fails on a GNU extension instead of compiling here and
# breaking under MSVC. Portability is the whole point of this directory.
set(CMAKE_CXX_EXTENSIONS OFF)

# Single-config generators (Ninja, Makefiles) need a build type chosen up front;
# multi-config ones (Visual Studio, Xcode) pick it at build time and ignore this.
if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
    set(CMAKE_BUILD_TYPE Release CACHE STRING "Build type" FORCE)
endif()

option(HELLO_WERROR "Treat compiler warnings as errors" ON)

add_executable(hello src/hello.cpp)

# The flag spellings differ per compiler; the intent does not.
if(MSVC)
    target_compile_options(hello PRIVATE /W4 $<$<BOOL:${HELLO_WERROR}>:/WX>)
else()
    target_compile_options(hello PRIVATE -Wall -Wextra -Wpedantic
                                         $<$<BOOL:${HELLO_WERROR}>:-Werror>)
endif()

enable_testing()

# A smoke test, not a test suite -- there is one function and it has no inputs.
# What it is actually here to prove is that the binary this platform just
# produced *executes* and says the right thing, which is the claim a
# cross-compiled artifact cannot make about itself.
add_test(NAME hello_runs COMMAND hello)
set_tests_properties(hello_runs PROPERTIES
    # Anchored at the start but not the end: Windows ends the line "\r\n".
    PASS_REGULAR_EXPRESSION "^Hello, World!")

install(TARGETS hello RUNTIME DESTINATION bin)
