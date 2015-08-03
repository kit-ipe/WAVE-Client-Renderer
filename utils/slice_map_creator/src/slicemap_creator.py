#!/usr/bin/python
# -*- coding: UTF-8 -*-

import json
import os
import re

from PIL import Image
import math

class SliceMapCreator:
    def create(self):
        # print self.config

        # # Type of image filter for slicemap
        # if self.config.filter == 'n':
        #     filter = Image.NEAREST
        # elif self.config.filter == 'bl':
        #     filter = Image.BILINEAR
        # elif self.config.filter == 'bc':
        #     filter = Image.BICUBIC
        # elif self.config.filter == 'a':
        #     filter = Image.ANTIALIAS
        
        # # Path to slices
        # path_to_slices = self.config.path_to_slices

        # # Regex exp for name of slice
        # slice_name_format = self.config.slice_name_format
        
        # # Path for slicemaps
        # path_to_slicemaps = self.config.path_to_slicemaps

        # # Regex exp for name of slice
        # slicemap_name_format = self.config.slicemap_name_format

        # # Number of cols and rows
        # row_col = self.config.row_col

        # # Slicemap size
        # slicemap_size = self.config.slicemap_size

        # print("Slicemap size: {0}, {1}".format(slicemap_size[0], slicemap_size[1]))

        # # Getting list of slices in the dir
        # files_list = os.listdir(path_to_slices)
        
        # def sort_slices(a, b):
        #     a_str_val = re.findall("[0-9]+", a[::-1])[0][::-1]
        #     tmp = "0";
        #     copy_allowed = False
        #     for i in range(0, len(a_str_val)):
        #         if a_str_val[i] != '0' or copy_allowed == True:
        #             tmp += a_str_val[i]
        #             copy_allowed = True

        #     a_str_val = tmp
        #     a_value = int(a_str_val)

        #     b_str_val = re.findall("[0-9]+", b[::-1])[0][::-1]
        #     tmp = "0";
        #     copy_allowed = False
        #     for i in range(0, len(b_str_val)):
        #         if b_str_val[i] != '0' or copy_allowed == True:
        #             tmp += b_str_val[i]
        #             copy_allowed = True
        #     b_str_val = tmp                            
        #     b_value = int(b_str_val)

        #     return a_value - b_value;

        # files_list = sorted(files_list, cmp=sort_slices)

        # slices_path_list = []
        # slices_name_list = []
        # for slice_name in files_list:
        #     path_to_slice = os.path.join(path_to_slices, slice_name)
        #     if re.match(slice_name_format, slice_name) and os.path.isfile(path_to_slice):
        #         slices_path_list.append(path_to_slice)
        #         slices_name_list.append(slice_name)

        # # Slices range
        # slices_range = self.config.slices_range
        # slices_range[0] = int(self.config.slices_range[0])
        # slices_range[1] = len(slices_path_list) if self.config.slices_range[1] == "*" else int(self.config.slices_range[1])

        # # Number of slices
        # number_of_slices = slices_range[1] - slices_range[0]
        # print("Number of slices: {0}".format(number_of_slices))

        # # Original slice size
        # slice0 = Image.open(slices_path_list[0])
        # original_slice_size = [slice0.size[0], slice0.size[1]]
        # print("Original slice size: {0},{1}".format(original_slice_size[0], original_slice_size[1]))        

        # # Slicemap slice size
        # # slicemap_slice_size = [slicemap_size[0] / row_col[0], slicemap_size[1] / row_col[1]]
        # slicemap_slice_size = [0,0]
        # slicemap_slice_size[0] = slicemap_size[0] / row_col[0] if slicemap_size[0] % row_col[0] == 0 else math.ceil(slicemap_size[0] / row_col[0])
        # slicemap_slice_size[0] = slicemap_size[1] / row_col[1] if slicemap_size[1] % row_col[1] == 0 else math.ceil(slicemap_size[1] / row_col[1])
        # print("Slicemap slice size: {0},{1}".format(slicemap_slice_size[0], slicemap_slice_size[1]))


        # # Proposional slicemap slice size
        # proposional_slicemap_slice_size = [0,0]
        # if original_slice_size[0] <= original_slice_size[1]:            
        #     proposional_slicemap_slice_size[1] = int(slicemap_slice_size[1])
        #     proposional_slicemap_slice_size[0] = int(math.ceil( slicemap_slice_size[0] * original_slice_size[0] / original_slice_size[1] ))
        # else:
        #     proposional_slicemap_slice_size[0] = int(slicemap_slice_size[0])
        #     proposional_slicemap_slice_size[1] = int(math.ceil( slicemap_slice_size[1] * original_slice_size[1] / original_slice_size[0] ))
        # print("Proposional slicemap slice size: {0},{1}".format(proposional_slicemap_slice_size[0], proposional_slicemap_slice_size[1]))

        ## Area of every slice for slice map
        # area_of_slice = self.config.area_of_slice
        # area_of_slice[1][0] = slicemap_slice_size[0] if area_of_slice[1][0] == "*" else int(area_of_slice[1][0])
        # area_of_slice[1][1] = slicemap_slice_size[1] if area_of_slice[1][1] == "*" else int(area_of_slice[1][1])


        # Images for slicemaps
        slicemaps_images = []

        # slicemap_slices_number = int(self.row_col[0] * self.row_col[1])

        # slicemaps_number = int(math.ceil(self.number_of_slices / self.slicemap_slices_number))

        for i in range(0, self.slicemaps_number):
            slicemap_image = Image.new('L', (int(self.slicemap_slice_size[0] * self.row_col[0]), int(self.slicemap_slice_size[0] * self.row_col[0])))
            slicemaps_images.append(slicemap_image)

        # print("Number of slicemaps: {0}".format(slicemaps_number))

        # Read files 1 by 1 from dir
        for slice_id in range(self.slices_range[0], self.slices_range[1]):
            slice_path = self.slices_path_list[slice_id]
            print("Slice path: {0}".format(slice_path))

            slice_global_order_id = int(slice_id - self.slices_range[0])
            print("Slice global order id: {0}".format(slice_global_order_id))

            slice_local_order_id = int(slice_global_order_id % self.slicemap_slices_number)
            print("Slice local order id: {0}".format(slice_local_order_id))
            
            slicemap_id = int(slice_global_order_id / self.slicemap_slices_number)
            print("Slicemap id: {0}".format(slicemap_id))

            slice_image = Image.open(slice_path)

            slice_image = slice_image.resize((self.proposional_slicemap_slice_size[0], self.proposional_slicemap_slice_size[1]), self.filter)

            slice_col_pos = int(slice_local_order_id % self.row_col[0])
            slice_row_pos = int(slice_local_order_id / self.row_col[1])

            point0 = [ int(slice_col_pos * self.slicemap_slice_size[0]), int(slice_row_pos * self.slicemap_slice_size[1]) ]
            point1 = [ int(point0[0] + slice_image.size[0]), int(point0[1] + slice_image.size[1]) ]

            print("Position: {0}".format( (point0[0], point0[1], point1[0], point1[1]) ))
            
            slicemaps_images[slicemap_id].paste(slice_image, (point0[0], point0[1], point1[0], point1[1]))

        for i in range(0, self.slicemaps_number):
            slicemaps_images[i] = slicemaps_images[i].resize((self.slicemap_size[0], self.slicemap_size[1]), self.filter)
            slicemaps_images[i].save(os.path.join(self.path_to_slicemaps, self.slicemap_name_format.format(i)), format='PNG', progressive=True)

        print("******************************************************************")
        print("Slicemap size: {0}, {1}".format(self.slicemap_size[0], self.slicemap_size[1]))
        print("Number of slices: {0}".format(self.number_of_slices))
        print("Original slice size: {0},{1}".format(self.original_slice_size[0], self.original_slice_size[1]))        
        print("Slicemap slice size: {0},{1}".format(self.slicemap_slice_size[0], self.slicemap_slice_size[1]))
        print("Proposional slicemap slice size: {0},{1}".format(self.proposional_slicemap_slice_size[0], self.proposional_slicemap_slice_size[1]))

    def init(self):
        # Type of image filter for slicemap
        if self.config.filter == 'n':
            self.filter = Image.NEAREST
        elif self.config.filter == 'bl':
            self.filter = Image.BILINEAR
        elif self.config.filter == 'bc':
            self.filter = Image.BICUBIC
        elif self.config.filter == 'a':
            self.filter = Image.ANTIALIAS
        print("Filter: {0}".format(self.config.filter))

        # Path to slices
        self.path_to_slices = self.config.path_to_slices
        print("path to slices: {0}".format(self.path_to_slices))

        # Regex exp for name of slice
        self.slice_name_format = self.config.slice_name_format
        print("Slice name format: {0}".format(self.slice_name_format))
        
        # Path for slicemaps
        self.path_to_slicemaps = self.config.path_to_slicemaps
        print("Path to slicemap: {0}".format(self.path_to_slicemaps))

        # Regex exp for name of slice
        self.slicemap_name_format = self.config.slicemap_name_format
        print("Slicemap name format: {0}".format(self.slicemap_name_format))

        # Number of cols and rows
        self.row_col = self.config.row_col
        print("Row Col slicemap size: {0}".format(self.row_col))

        # Slicemap size
        self.slicemap_size = self.config.slicemap_size
        print("Slicemap size: {0}".format(self.slicemap_size))

        # Getting list of slices in the dir
        self.files_list = os.listdir(self.path_to_slices)

        def sort_slices(a, b):
            a_str_val = re.findall("[0-9]+", a[::-1])[0][::-1]
            tmp = "0";
            copy_allowed = False
            for i in range(0, len(a_str_val)):
                if a_str_val[i] != '0' or copy_allowed == True:
                    tmp += a_str_val[i]
                    copy_allowed = True

            a_str_val = tmp
            a_value = int(a_str_val)

            b_str_val = re.findall("[0-9]+", b[::-1])[0][::-1]
            tmp = "0";
            copy_allowed = False
            for i in range(0, len(b_str_val)):
                if b_str_val[i] != '0' or copy_allowed == True:
                    tmp += b_str_val[i]
                    copy_allowed = True
            b_str_val = tmp                            
            b_value = int(b_str_val)

            return a_value - b_value;

        self.files_list = sorted(self.files_list, cmp=sort_slices)

        self.slices_path_list = []
        self.slices_name_list = []
        for slice_name in self.files_list:
            path_to_slice = os.path.join(self.path_to_slices, slice_name)
            if re.match(self.slice_name_format, slice_name) and os.path.isfile(path_to_slice):
                self.slices_path_list.append(path_to_slice)
                self.slices_name_list.append(slice_name)

        # Slices range
        self.slices_range = self.config.slices_range
        self.slices_range[0] = int(self.config.slices_range[0])
        self.slices_range[1] = len(self.slices_path_list) if self.config.slices_range[1] == "*" else int(self.config.slices_range[1])
        print("Slices range: {0}".format(self.slices_range))

        # Number of slices
        self.number_of_slices = self.slices_range[1] - self.slices_range[0]
        print("Number of slices: {0}".format(self.number_of_slices))

        # Original slice size
        slice0 = Image.open(self.slices_path_list[0])
        self.original_slice_size = [slice0.size[0], slice0.size[1]]
        print("Original slice size: {0}".format(self.original_slice_size))

        # Slicemap slice size
        # slicemap_slice_size = [slicemap_size[0] / row_col[0], slicemap_size[1] / row_col[1]]
        self.slicemap_slice_size = [0,0]
        self.slicemap_slice_size[0] = self.slicemap_size[0] / self.row_col[0] if self.slicemap_size[0] % self.row_col[0] == 0 else math.ceil(self.slicemap_size[0] / self.row_col[0])
        self.slicemap_slice_size[1] = self.slicemap_size[1] / self.row_col[1] if self.slicemap_size[1] % self.row_col[1] == 0 else math.ceil(self.slicemap_size[1] / self.row_col[1])
        print("Slicemap slice size: {0}".format(self.slicemap_slice_size))

        # Proposional slicemap slice size
        self.proposional_slicemap_slice_size = [0,0]
        if self.original_slice_size[0] <= self.original_slice_size[1]:            
            self.proposional_slicemap_slice_size[1] = int(self.slicemap_slice_size[1])
            self.proposional_slicemap_slice_size[0] = int(math.ceil( self.slicemap_slice_size[0] * self.original_slice_size[0] / self.original_slice_size[1] ))
        else:
            self.proposional_slicemap_slice_size[0] = int(self.slicemap_slice_size[0])
            self.proposional_slicemap_slice_size[1] = int(math.ceil( self.slicemap_slice_size[1] * self.original_slice_size[1] / self.original_slice_size[0] ))
        print("Proposional slicemap slice size: {0}".format(self.proposional_slicemap_slice_size))

        ## Area of every slice for slice map
        # area_of_slice = self.config.area_of_slice
        # area_of_slice[1][0] = slicemap_slice_size[0] if area_of_slice[1][0] == "*" else int(area_of_slice[1][0])
        # area_of_slice[1][1] = slicemap_slice_size[1] if area_of_slice[1][1] == "*" else int(area_of_slice[1][1])

        self.slicemap_slices_number = int(self.row_col[0] * self.row_col[1])
        print("Slicemap slices number: {0}".format(self.slicemap_slices_number))

        self.slicemaps_number = int(math.ceil(float(self.number_of_slices) / float(self.slicemap_slices_number)))        
        print("Slicemaps number: {0}".format(self.slicemaps_number))

        print("****************************************************************************")

    def getJsonConfig(self):
        data = {}
        # data["area_of_slice"] = self.config.area_of_slice
        data["filter"] = self.config.filter
        data["path_to_slicemaps"] = self.config.path_to_slicemaps
        data["path_to_slices"] = self.config.path_to_slices
        data["row_col"] = self.config.row_col
        data["slicemap_size"] = self.config.slicemap_size
        data["slices_range"] = self.config.slices_range
        return json.dumps(data)

    def __init__(self, config):
        self.config = config

        self.init()