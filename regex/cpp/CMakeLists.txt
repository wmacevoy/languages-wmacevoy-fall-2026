cmake_minimum_required(VERSION 3.16)

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
# One ctest entry that runs the whole GoogleTest binary, which reads cases.txt
# fresh every run. gtest_discover_tests would give one ctest entry per case,
# but it lists them only when the binary changes -- in every DISCOVERY_MODE --
# so a case added to cases.txt would silently go unrun. See ../time.md.
add_test(NAME json_number_test COMMAND json_number_test)
