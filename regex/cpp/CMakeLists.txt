cmake_minimum_required(VERSION 3.18)

project(json_number LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

include(FetchContent)
FetchContent_Declare(googletest
    URL https://github.com/google/googletest/archive/refs/tags/v1.15.2.tar.gz
    DOWNLOAD_EXTRACT_TIMESTAMP TRUE)
# Keep gtest's C runtime the same as ours under MSVC.
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
set(INSTALL_GTEST OFF CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

add_library(json_number json_number.cpp)
target_include_directories(json_number PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

add_executable(json_number_test json_number_test.cpp)
target_link_libraries(json_number_test PRIVATE json_number GTest::gtest_main)
target_compile_definitions(json_number_test PRIVATE
    CASES_FILE="${CMAKE_CURRENT_SOURCE_DIR}/../cases.txt")

enable_testing()
include(GoogleTest)
# The cases are read from cases.txt at run time, so list them at test time too:
# discovering at build time would miss a case added without a rebuild.
gtest_discover_tests(json_number_test DISCOVERY_MODE PRE_TEST)
