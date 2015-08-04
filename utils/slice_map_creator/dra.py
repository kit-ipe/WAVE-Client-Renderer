#!/usr/bin/python
# -*- coding: UTF-8 -*-
 
import sys
import argparse
import re

import os.path

from src.slicemap_creator import SliceMapCreator

version = "0.0.0.0"

def resolution_parse(string):
    if not(bool(re.match("^([0-9]+x[0-9]+)$", string))):
        msg = "%r bad format " % string
        raise argparse.ArgumentTypeError(msg)
    return [ int(i) for i in string.split('x') ]

def slice_range_parse(string):
    if not(bool(re.match("^([0-9]+x[0-9,*]+)$", string))):
        msg = "%r bad format " % string
        raise argparse.ArgumentTypeError(msg)
    return string.split('x')

def area_of_slice_parse(string):
    if not(bool(re.match("^([0-9]+x[0-9]+,[0-9,*]+x[0-9,*]+)$", string))):
        msg = "%r bad format " % string
        raise argparse.ArgumentTypeError(msg)
    point_strings = string.split(',')
    point_left = point_strings[0].split('x')
    point_right = point_strings[1].split('x')
    return [point_left, point_right]

def path_parse(string):
    if not(bool(os.path.isdir(string))):
        msg = "%r bad path " % string
        raise argparse.ArgumentTypeError(msg)
    return string

def createParser ():
    # Создаем класс парсера
    parser = argparse.ArgumentParser(
            prog = 'slicemapcreator',
            description = '''Application for creation slice map from images in formats: png, jpeg, tiff, raw and etc.''',
            epilog = '''(c) Sogimu, 2015.''',
            add_help = False
            )
 
    # Создаем группу параметров для родительского парсера,
    # ведь у него тоже должен быть параметр --help / -h
    parent_group = parser.add_argument_group (title='Settings')
 
    parent_group.add_argument ('--help', '-h', action='help', help='Help')

    parent_group.add_argument ('--version', '-v',
                action='version',
                help = 'Print version',
                version='%(prog)s {}'.format (version))

    # Создаем группу подпарсеров
    subparsers = parser.add_subparsers (dest = 'command',
            title = 'Commands',
            description = 'Commands for first param %(prog)s')

    # Создаем парсер для команды create
    create_parser = subparsers.add_parser ('create',
            add_help = False,
            help = 'Run in mode "Create slicemap"',
            description = '''Command for creating clicemap.''')
 
    # Создаем новую группу параметров
    create_group = create_parser.add_argument_group (title='Settings')
 
    # Добавляем параметры
    create_group.add_argument ('-ps', '--path-to-slices', type=path_parse, required=True,
            help = 'Absolute path to images (slices).',
            metavar = 'STR')

    create_group.add_argument ('-snf', '--slice-name-format', type=str, default='slice-*.png',
            help = r'Format name of image (slices). Example: slice_{d}.png',
            metavar = 'STR')

    create_group.add_argument ('-psm', '--path-to-slicemaps', type=path_parse, default='./',
            help = 'Absolute path to slicemaps images. Example: /home/user/data/slices/',
            metavar = 'STR')

    create_group.add_argument ('-smnf', '--slicemap-name-format', type=str, default='slicemap{0}.png',
            help = r'Format name of slicemap. Example: slicemap{0}.png',
            metavar = 'STR')

    create_group.add_argument ('-ssm', '--slicemap-size', type=resolution_parse, default='4096x4096',
            help = 'Size of slicemap. Possible values: "512x512", "1024x1024", "2048x2048", "4096x4096", "8192x8192", "16384x16384". Example: 4096x4096',
            metavar = 'STR')

    create_group.add_argument ('-as', '--area-of-slice', type=area_of_slice_parse, default='0x0,*x*',
            help = 'Area between left-top and right-bottom points on every slice for slicemap. Format: ^([0-9]+x[0-9]+,[0-9,*]+x[0-9,*]+)$. Example: 100x100,300x300',
            metavar = 'STR')

    create_group.add_argument ('-sr', '--slices-range', type=slice_range_parse, default='0x*',
            help = 'Range of slices for slicemap. Format: ^([0-9]+x[0-9,*]+)$. Example: 100x*',
            metavar = 'STR')

    create_group.add_argument ('-rc', '--row-col', type=resolution_parse, default='10x10', 
            help = 'Number of rows and cols in slicemap. Format: ^([0-9]+x[0-9]+)$. Example: 16x16.',
            metavar = 'STR')

    create_group.add_argument ('-f', '--filter', type=str, default='bl', choices=['n', 'bl', 'bc', 'a'],
            help = 'Name of filter for image. Possible values: "n" - NEAREST, "bl" - BILINEAR, "bc" - BICUBIC, "a" - ANTIALIAS. Example: n',
            metavar = 'STR')

    create_group.add_argument ('--help', '-h', action='help', help='Help')
 
    return parser

def create_clicemap (namespace):
    """
    Выполнение команды create_clicemap
    """
    print("Create clicemap!")

if __name__ == '__main__':
    parser = createParser()
    namespace = parser.parse_args(sys.argv[1:])
 
    # print (namespace)

    smc = SliceMapCreator(namespace)
 
    if namespace.command == "create":
        smc.create()
        print("Meta information: ")
        print(smc.getJsonConfig())
    else:
        parser.print_help()
        